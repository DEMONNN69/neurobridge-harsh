from django.contrib import admin
from .models import AssessmentQuestion, AssessmentSession, AssessmentResponse

@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ['question_id', 'condition_type', 'difficulty_level', 'question_text_short', 'correct_answer', 'created_at']
    list_filter = ['condition_type', 'difficulty_level', 'created_at']
    search_fields = ['question_text', 'question_id']
    readonly_fields = ['question_id', 'created_at']
    
    def question_text_short(self, obj):
        return obj.question_text[:50] + "..." if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question Text'

@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'accuracy_percentage', 'total_questions', 'correct_answers', 
                   'predicted_dyslexic_type', 'predicted_severity', 'created_at']
    list_filter = ['predicted_dyslexic_type', 'predicted_severity', 'created_at']
    search_fields = ['user__username', 'session_id']
    readonly_fields = ['session_id', 'created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(AssessmentResponse)
class AssessmentResponseAdmin(admin.ModelAdmin):
    list_display = ['session', 'question_id_display', 'condition_type', 'user_answer', 
                   'correct_answer', 'is_correct', 'response_time']
    list_filter = ['is_correct', 'question__condition_type', 'question__difficulty_level']
    search_fields = ['session__user__username', 'question__question_id']
    
    def question_id_display(self, obj):
        return str(obj.question.question_id)[:8] + "..."
    question_id_display.short_description = 'Question ID'
    
    def condition_type(self, obj):
        return obj.question.condition_type
    condition_type.short_description = 'Condition'
    
    def correct_answer(self, obj):
        return obj.question.correct_answer
    correct_answer.short_description = 'Correct Answer'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session__user', 'question')
