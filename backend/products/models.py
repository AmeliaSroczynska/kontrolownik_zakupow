from django.db import models


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

    def __str__(self):
        return self.name