# products/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product


class SignalHandler:
    """
    Klasa implementująca wzorzec Obserwatora.
    Nasłuchuje zmian w modelu Product i wyzwala alerty, gdy stan jest niski.
    """

    @staticmethod
    @receiver(post_save, sender=Product)
    def post_save_receiver(sender, instance, **kwargs):
        if instance.quantity < instance.minimum_quantity:
            print(f"Stan produktu '{instance.name}' jest krytyczny "
                  f"({instance.quantity} < {instance.minimum_quantity}). Trzeba kupić!")
