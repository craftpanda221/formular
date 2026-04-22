from django import forms
from .models import Formular

class FormularForm(forms.ModelForm):
    datum = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'})
    )

    class Meta:
        model = Formular
        fields = '__all__'
        widgets = {
        'pracovni_ukon': forms.Textarea(attrs={'rows': 1}),
        'specifika_pracoviste': forms.Textarea(attrs={'rows': 3}),
        'postup_prace': forms.Textarea(attrs={'rows': 10, 'placeholder':'Kdo? Kde? Jak? Kdy? Technologie? Vybavení?\n1.\n2.'})
    }