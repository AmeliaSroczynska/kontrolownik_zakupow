from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    class Unit(models.TextChoices):
        PIECES = 'PCS', 'kawałków'
        SLICES = 'SLI', 'plasterków'
        BOTTLE = 'BTL', 'butelki'
        CAPSULES = 'CAP', 'kapsułek'
        CARTON = 'CRT', 'kartonu'

    name = models.CharField(max_length=20)
    quantity = models.FloatField()
    slug = models.SlugField(unique=True, blank=True, max_length=20)
    unit = models.CharField(
        max_length=3,
        choices=Unit.choices,
        default=Unit.PIECES,
    )
    minimum_quantity = models.PositiveIntegerField()
    expiration_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:20]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
