from django.db import models

class Formular(models.Model):
    zhotovitel = models.CharField(max_length=255, blank=True, null=True)
    zadavatel = models.CharField(max_length=255, blank=True, null=True)
    kontakt = models.CharField(max_length=255, blank=True, null=True)
    telefonZadavatel = models.CharField(max_length=20, blank=True, null=True)
    jmenoPrijmeni = models.CharField(max_length=20, blank=True, null=True)
    telefonMajitel = models.CharField(max_length=20, blank=True, null=True)
    datum = models.DateField(blank=True, null=True)
    pracovni_doba = models.CharField(max_length=100, blank=True, null=True)
    misto_prace = models.CharField(max_length=255, blank=True, null=True)
    souradnice = models.CharField(max_length=100, blank=True, null=True)
    max_vyska = models.CharField(max_length=50, blank=True, null=True)
    zarizeni = models.CharField(max_length=255, blank=True, null=True)
    strom = models.CharField(max_length=255, blank=True, null=True)
    pracovni_ukon = models.TextField(blank=True, null=True)
    specifika_pracoviste = models.TextField(blank=True, null=True)
    postup_prace = models.TextField(blank=True, null=True,)
    foto = models.ImageField(upload_to='fotky/', blank=True, null=True)
    vedouci_jmeno = models.CharField(max_length=255, blank=True, null=True)
    vedouci_cinnost = models.CharField(max_length=255, blank=True, null=True)
    vedouci_kvalifikace = models.CharField(max_length=255, blank=True, null=True)

    


