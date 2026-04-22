from django.urls import path
from . import views

urlpatterns = [
    path('', views.vytvorit_formular, name='vytvorit_formular'),
    path('import-json/', views.import_json),
]