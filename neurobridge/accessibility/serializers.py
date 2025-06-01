from rest_framework import serializers
from .models import AccessibilitySettings, DyslexiaProfile, AccessibilityLog, SupportRequest

class AccessibilitySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessibilitySettings
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class DyslexiaProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DyslexiaProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class AccessibilityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessibilityLog
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')

class SupportRequestSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportRequest
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at', 'resolved_at')

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None
