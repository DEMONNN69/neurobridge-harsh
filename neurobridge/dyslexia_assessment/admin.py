from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TaskCategory, AgeRange, DifficultyLevel, Question, 
    QuestionOption, AssessmentSession, StudentResponse, QuestionSet
)


class QuestionOptionInline(admin.TabularInline):
    """Inline editing for question options"""
    model = QuestionOption
    extra = 4  # Show 4 empty option fields by default
    fields = ['option_text', 'is_correct', 'order', 'explanation']
    ordering = ['order']


@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'weight', 'is_active', 'question_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['weight', 'is_active']
    
    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


@admin.register(AgeRange)
class AgeRangeAdmin(admin.ModelAdmin):
    list_display = ['name', 'min_age', 'max_age']
    ordering = ['min_age']


@admin.register(DifficultyLevel)
class DifficultyLevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    list_editable = ['order']
    ordering = ['order']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'question_type', 'category', 'difficulty_level', 
        'points', 'is_published', 'is_active', 'preview_image'
    ]
    list_filter = [
        'question_type', 'category', 'difficulty_level', 
        'is_published', 'is_active', 'created_at'
    ]
    search_fields = ['title', 'question_text']
    list_editable = ['is_published', 'is_active', 'points']
    
    filter_horizontal = ['age_ranges']
    inlines = [QuestionOptionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'question_text', 'question_type', 'instructions')
        }),
        ('Categorization', {
            'fields': ('category', 'difficulty_level', 'age_ranges', 'grade_levels')
        }),
        ('Media', {
            'fields': ('image', 'audio_file', 'audio_instructions'),
            'classes': ['collapse']
        }),
        ('Scoring & Timing', {
            'fields': ('points', 'time_limit'),
        }),
        ('Publication', {
            'fields': ('is_published', 'is_active'),
        }),
        ('Advanced', {
            'fields': ('additional_data',),
            'classes': ['collapse']
        })
    )
    
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    def preview_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover;" />',
                obj.image.url
            )
        return "No image"
    preview_image.short_description = 'Preview'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ['question', 'option_text_short', 'is_correct', 'order']
    list_filter = ['is_correct', 'question__category']
    search_fields = ['option_text', 'question__title']
    list_editable = ['is_correct', 'order']
    
    def option_text_short(self, obj):
        return obj.option_text[:50] + "..." if len(obj.option_text) > 50 else obj.option_text
    option_text_short.short_description = 'Option Text'


class StudentResponseInline(admin.TabularInline):
    model = StudentResponse
    extra = 0
    readonly_fields = ['question', 'selected_option', 'text_response', 'time_taken_seconds', 'score_earned', 'answered_at']
    can_delete = False


@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'status', 'started_at', 'total_score', 
        'max_possible_score', 'accuracy_percentage', 'risk_level'
    ]
    list_filter = ['status', 'started_at']
    search_fields = ['student__username', 'student__email']
    readonly_fields = [
        'started_at', 'total_score', 'max_possible_score', 
        'accuracy_percentage', 'risk_indicators'
    ]
    
    inlines = [StudentResponseInline]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('student', 'status', 'started_at', 'completed_at', 'total_time_seconds')
        }),
        ('Results', {
            'fields': ('total_score', 'max_possible_score', 'accuracy_percentage')
        }),
        ('Analysis', {
            'fields': ('risk_indicators', 'pre_assessment_data'),
            'classes': ['collapse']
        })
    )
    
    def risk_level(self, obj):
        if not obj.risk_indicators:
            return "Not calculated"
        
        high_risk_count = sum(1 for level in obj.risk_indicators.values() if level == 'high_risk')
        if high_risk_count > 0:
            return format_html('<span style="color: red;">High Risk ({})</span>', high_risk_count)
        
        moderate_risk_count = sum(1 for level in obj.risk_indicators.values() if level == 'moderate_risk')
        if moderate_risk_count > 0:
            return format_html('<span style="color: orange;">Moderate Risk ({})</span>', moderate_risk_count)
        
        return format_html('<span style="color: green;">Low Risk</span>')
    risk_level.short_description = 'Risk Level'


@admin.register(StudentResponse)
class StudentResponseAdmin(admin.ModelAdmin):
    list_display = [
        'session', 'question', 'is_correct', 'score_earned', 
        'time_taken_seconds', 'needs_review', 'answered_at'
    ]
    list_filter = ['is_correct', 'needs_review', 'auto_scored', 'question__category']
    search_fields = ['session__student__username', 'question__title']
    readonly_fields = ['session', 'question', 'answered_at', 'auto_scored']
    
    fieldsets = (
        ('Response Info', {
            'fields': ('session', 'question', 'answered_at')
        }),
        ('Response Data', {
            'fields': ('selected_option', 'text_response', 'response_data')
        }),
        ('Scoring', {
            'fields': ('is_correct', 'score_earned', 'time_taken_seconds', 'auto_scored')
        }),
        ('Review', {
            'fields': ('needs_review', 'reviewed_by', 'review_notes')
        })
    )


@admin.register(QuestionSet)
class QuestionSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'randomize_questions', 'max_questions', 'question_count']
    list_filter = ['is_active', 'randomize_questions', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['questions', 'target_age_ranges', 'target_categories']
    
    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


# Custom admin site header
admin.site.site_header = "NeuroBridge Dyslexia Assessment Admin"
admin.site.site_title = "Dyslexia Assessment"
admin.site.index_title = "Manage Dyslexia Assessment"
