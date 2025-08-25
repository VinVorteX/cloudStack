from django.db import models 
from django.contrib.auth.models import User 
from storages.backends.s3boto3 import S3Boto3Storage

class File(models.Model): 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files') 
    name = models.CharField(max_length=255) 
    file = models.FileField(upload_to='uploads/', storage=S3Boto3Storage) 
    file_type = models.CharField(max_length=100) 
    size = models.BigIntegerField() # Size in bytes 
    upload_date = models.DateTimeField(auto_now_add=True) 
    is_deleted = models.BooleanField(default=False) 
    thumbnail = models.URLField(max_length=500, blank=True, null=True) 

    def __str__(self): 
        return self.name 
    
    @property 
    def formatted_size(self):
        size_mb = self.size / 1024 / 1024 
        return f"{size_mb:.1f} MB"

    @property
    def formatted_upload_date(self):
        from django.utils.timesince import timesince
        return f"{timesince(self.upload_date)} ago"