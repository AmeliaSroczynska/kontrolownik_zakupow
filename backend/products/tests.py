from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError
from unittest.mock import patch
from django.db import IntegrityError
from .serializers import ProductSerializer

from .models import Product
from .validators import QuantityValidator


class ProductModelTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Mleko",
            quantity=2.0,
            slug="mleko",
            unit=Product.Unit.BOTTLE,
            minimum_quantity=1
        )

    def test_product_creation(self):
        """Sprawdza, czy obiekt poprawnie zapisuje się w bazie z odpowiednimi wartościami."""
        self.assertEqual(self.product.name, "Mleko")
        self.assertEqual(self.product.quantity, 2.0)
        self.assertEqual(self.product.unit, 'BTL')

    def test_product_str_method(self):
        """Sprawdza, czy model zwraca poprawną reprezentację tekstową (nazwę)."""
        self.assertEqual(str(self.product), "Mleko")


class QuantityValidatorTests(TestCase):
    def setUp(self):
        self.product = Product(
            name="Testowy Ser",
            quantity=1.0,
            slug="testowy-ser",
            unit=Product.Unit.SLICES,
            minimum_quantity=1
        )

    def test_validate_integrity_success(self):
        """Walidator nie powinien zgłaszać błędu, gdy stan jest dodatni."""
        try:
            QuantityValidator.validate_integrity(self.product)
        except ValidationError:
            self.fail("Walidator rzucił wyjątek, chociaż towar jest na stanie")

    def test_validate_integrity_fails_when_zero(self):
        """Walidator musi zablokować operację, gdy stan wynosi zero."""
        self.product.quantity = 0
        with self.assertRaisesMessage(ValidationError, 'Brak produktu na stanie.'):
            QuantityValidator.validate_integrity(self.product)

    def test_validate_integrity_fails_when_negative(self):
        """Walidator musi zablokować operację przy stanach ujemnych."""
        self.product.quantity = -5.0
        with self.assertRaises(ValidationError):
            QuantityValidator.validate_integrity(self.product)


class ProductAPITests(APITestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Kawa",
            quantity=5.0,
            slug="kawa",
            unit=Product.Unit.PIECES,
            minimum_quantity=2
        )
        self.take_url = f'/api/products/{self.product.slug}/take/'
        self.add_url = f'/api/products/{self.product.slug}/add/'

    def test_add_action_increases_quantity(self):
        """Wysłanie żądania POST na endpoint /add/ powinno zwiększyć ilość o 1."""
        response = self.client.post(self.add_url)
        self.assertEqual(response.status_code, 200)

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 6.0)

    def test_take_action_decreases_quantity(self):
        """Wysłanie żądania POST na endpoint /take/ powinno zmniejszyć ilość o 1."""
        response = self.client.post(self.take_url)
        self.assertEqual(response.status_code, 200)

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 4.0)

    def test_take_action_fails_when_empty(self):
        """Żądanie /take/ przy zerowym stanie musi zwrócić błąd HTTP 400 z walidatora."""
        self.product.quantity = 0
        self.product.save()

        response = self.client.post(self.take_url)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0.0)


class SignalTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Szynka",
            quantity=5.0,
            slug="szynka",
            unit=Product.Unit.SLICES,
            minimum_quantity=2
        )

    @patch('builtins.print')
    def test_signal_triggers_print_on_low_quantity(self, mock_print):
        """
        Gdy stan zapisywanego produktu spadnie poniżej minimum,
        Obserwator powinien to wyłapać i uruchomić alert (na razie print).
        """
        self.product.quantity = 1.0  # Mniej niż minimum (2)
        self.product.save()  # To wyzwala sygnał post_save

        mock_print.assert_called_once()
        wydrukowany_tekst = mock_print.call_args[0][0]
        self.assertIn("Stan produktu 'Szynka' jest krytyczny", wydrukowany_tekst)

    @patch('builtins.print')
    def test_signal_does_not_trigger_when_quantity_is_fine(self, mock_print):
        """
        Gdy stan zapisywanego produktu jest bezpieczny,
        Obserwator nie powinien nic robić.
        """
        self.product.quantity = 10.0
        self.product.save()

        mock_print.assert_not_called()


class ProductSerializerTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Ketchup",
            quantity=50.0,
            slug="ketchup",
            unit=Product.Unit.PIECES,
            minimum_quantity=10
        )

    def test_serializer_contains_expected_fields(self):
        """Sprawdza, czy API na pewno wysyła do frontendu wszystkie potrzebne klucze."""
        serializer = ProductSerializer(instance=self.product)
        data = serializer.data
        oczekiwane_pola = {'id', 'name', 'quantity', 'slug', 'unit', 'unit_display', 'minimum_quantity'}
        self.assertEqual(set(data.keys()), oczekiwane_pola)

    def test_unit_display_is_correct(self):
        """Sprawdza, czy skrót 'PCS' jest poprawnie tłumaczony na 'kawałków' dla interfejsu."""
        serializer = ProductSerializer(instance=self.product)
        self.assertEqual(serializer.data['unit_display'], 'kawałków')


class AdvancedProductModelTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Jogurt",
            quantity=3.0,
            slug="jogurt",
            unit=Product.Unit.PIECES,
            minimum_quantity=1
        )

    def test_slug_must_be_unique(self):
        """Sprawdza, czy baza danych zablokuje próbę stworzenia dwóch produktów z tym samym adresem URL (slugiem)."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name="Inny Jogurt",
                quantity=1.0,
                slug="jogurt",
                unit=Product.Unit.PIECES,
                minimum_quantity=1
            )

    def test_expiration_date_can_be_null(self):
        """Sprawdza, czy nowo dodane pole expiration_date poprawnie akceptuje brak wartości."""
        self.assertIsNone(self.product.expiration_date)


class AdvancedProductAPITests(APITestCase):
    def setUp(self):
        self.product1 = Product.objects.create(
            name="Kawa", quantity=5.0, slug="kawa", unit=Product.Unit.PIECES, minimum_quantity=2
        )
        self.product2 = Product.objects.create(
            name="Mleko", quantity=2.0, slug="mleko", unit=Product.Unit.BOTTLE, minimum_quantity=1
        )

    def test_get_product_list(self):
        """Sprawdza, czy widok główny /api/products/ zwraca listę wszystkich produktów."""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_get_product_detail(self):
        """Sprawdza, czy endpoint /api/products/{slug}/ poprawnie zwraca dane konkretnego produktu."""
        response = self.client.get(f'/api/products/{self.product1.slug}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Kawa')
        self.assertEqual(response.data['quantity'], 5.0)

    def test_take_action_on_nonexistent_product(self):
        """Sprawdza zabezpieczenia – co się stanie, gdy ktoś spróbuje pobrać nieistniejący produkt."""
        response = self.client.post('/api/products/wielkie-nic/take/')
        self.assertEqual(response.status_code, 404)
