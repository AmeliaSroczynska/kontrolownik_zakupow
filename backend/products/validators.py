from rest_framework.exceptions import ValidationError


class QuantityValidator:
    """
    Klasa walidatora izolująca reguły biznesowe od warstwy widoków.
    """

    @staticmethod
    def validate_integrity(product):
        if product.quantity <= 0:
            raise ValidationError({'error': 'Brak produktu na stanie.'})