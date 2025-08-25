from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import File
from .serializers import FileSerializer
from django.http import FileResponse, HttpResponse, StreamingHttpResponse
from django.conf import settings
import boto3
from botocore.exceptions import ClientError
import os
import io

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            return File.objects.filter(user=self.request.user, is_deleted=False)
        except Exception as e:
            print(f"Error in get_queryset: {str(e)}")
            raise

    def perform_create(self, serializer):
        uploaded_file = self.request.data.get('file')
        print(f"DEBUG: Uploaded file - {uploaded_file}")  # Debug
        print(f"DEBUG: Uploaded file name - {uploaded_file.name if uploaded_file else 'None'}")  # Debug
        
        if not uploaded_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        file_type = (
            'application/pdf' if file_extension == '.pdf' else
            uploaded_file.content_type or 'application/octet-stream'
        )
        
        try:
            # Pass the file to the serializer so it gets saved to the FileField
            serializer.save(
                user=self.request.user,
                file=uploaded_file,  # ← THIS IS CRITICAL! You're missing this line
                file_type=file_type,
                size=uploaded_file.size,
                thumbnail=''
            )
            
            # Debug: Check if file was saved properly
            file_instance = serializer.instance
            print(f"DEBUG: Saved file instance - {file_instance}")
            print(f"DEBUG: Saved file field - {file_instance.file}")
            print(f"DEBUG: Saved file field name - {file_instance.file.name}")
            
        except Exception as e:
            print(f"Error in perform_create: {str(e)}")
            raise
    def perform_update(self, serializer):
        try:
            serializer.save()
        except Exception as e:
            print(f"Error in perform_update: {str(e)}")
            raise

    @action(detail=False, methods=['get'])
    def trash(self, request):
        try:
            queryset = File.objects.filter(user=request.user, is_deleted=True)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in trash action: {str(e)}")
            raise

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        try:
            file = self.get_object()
            if file.file_type.startswith('image/') or file.file_type == 'application/pdf':
                # Generate a presigned URL for MinIO/S3
                s3_client = boto3.client(
                    's3',
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                
                try:
                    s3_key = file.file.name
                    print(f"s3_key : {s3_key}")
                    # Generate presigned URL that expires in 1 hour
                    presigned_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                            'Key': s3_key,
                        },
                        ExpiresIn=3600  # 1 hour
                    )
                    return Response({'url': presigned_url})
                except ClientError as e:
                    print(f"Error generating presigned URL: {str(e)}")
                    return Response({'error': 'Could not generate preview URL'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            return Response({'message': 'Preview not available for this file type'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in preview action: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        try:
            file = self.get_object()
            s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            
            try:
                s3_key = file.file.name
                print(f"s3_key : {s3_key}")
                # Get the object from S3/MinIO
                response = s3_client.get_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=s3_key,
                )
                
                # Read the content from the streaming body
                file_content = response['Body'].read()
                
                # Create HTTP response with file content
                http_response = HttpResponse(
                    file_content,
                    content_type=file.file_type or 'application/octet-stream'
                )
                http_response['Content-Disposition'] = f'attachment; filename="{file.name}"'
                http_response['Content-Length'] = str(len(file_content))
                
                return http_response
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == 'NoSuchKey':
                    return Response({'error': 'File not found in storage'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    print(f"S3 ClientError: {str(e)}")
                    return Response({'error': 'Could not retrieve file from storage'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except File.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in download action: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'])
    def restore(self, request, pk=None):
        try:
            file = File.objects.get(id=pk, user=request.user)
            file.is_deleted = False
            file.save()
            return Response(self.get_serializer(file).data)
        except Exception as e:
            print(f"Error in restore action: {str(e)}")
            raise
    

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        try:
            # Get the file (including deleted ones)
            file = File.objects.get(id=pk, user=request.user)
            
            # Delete from S3
            s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            try:
                s3_client.delete_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=file.file.name
                )
            except ClientError as e:
                print(f"Error deleting file from S3: {str(e)}")
            
            # Delete from database
            file.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except File.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in permanent_delete action: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['delete'])
    def empty_trash(self, request):
        try:
            trashed_files = File.objects.filter(user=request.user, is_deleted=True)
            s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            for file in trashed_files:
                try:
                    s3_client.delete_object(
                        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                        Key=file.file.name
                    )
                except ClientError as e:
                    print(f"Error deleting file from S3: {str(e)}")
                    # Continue with other files even if one fails
            
            
            return Response({'message': f'{trashed_files.count()} files permanently deleted from storage'}, 
                      status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in empty_trash action: {str(e)}")
            raise