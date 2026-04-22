from django.shortcuts import render, redirect
from .forms import FormularForm
from .models import Formular
import json
from django.http import HttpResponse
from django.http import JsonResponse
from django.forms.models import model_to_dict

def vytvorit_formular(request):
    if request.method == 'POST':
        form = FormularForm(request.POST)
        if form.is_valid():
            formular = form.save()
            return redirect('detail', id=formular.id)
        else:
            print(form.errors)
    else:
        # 👇 tady načteme importovaná data
        initial_data = request.session.pop('import_data', None)

        if initial_data:
            form = FormularForm(initial=initial_data)
        else:
            form = FormularForm()

    return render(request, 'formular/formular.html', {'form': form})

def detail(request, id):
    formular = Formular.objects.get(id=id)
    return render(request, 'formular/detail.html', {'formular': formular})

def import_json(request):
    if request.method == "POST":
        data = json.loads(request.body)
        return JsonResponse(data)

def vytvorit_formular(request):
    if request.method == 'POST':
        form = FormularForm(request.POST)

        if form.is_valid():
            formular = form.save(commit=False)

            formular.pracovnici = request.POST.get('pracovnici_data')

            formular.save()

            return redirect('detail', id=formular.id)

        else:
            print(form.errors)

    else:
        initial_data = request.session.pop('import_data', None)

        if initial_data:
            form = FormularForm(initial=initial_data)
        else:
            form = FormularForm()

    

    return render(request, 'formular/formular.html', {'form': form})
