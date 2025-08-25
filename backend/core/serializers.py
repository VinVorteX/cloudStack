from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    size = serializers.SerializerMethodField()
    uploadDate = serializers.SerializerMethodField()
    type = serializers.CharField(source='file_type', required=False, allow_blank=True, allow_null=True)
    thumbnail = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    is_deleted = serializers.BooleanField(required=False, default=False)  
    file = serializers.FileField(write_only=True, required=False) 

    class Meta:
        model = File
        fields = ['id', 'name', 'type', 'size', 'uploadDate', 'thumbnail', 'is_deleted', 'file']

        extra_kwargs = {
            'file': {'write_only': True}  # Make file field write-only for security
        }

    def get_size(self, obj):
        return obj.formatted_size

    def get_uploadDate(self, obj):
        return obj.formatted_upload_date
