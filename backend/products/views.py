from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from .validators import QuantityValidator


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'slug'

    @action(methods=['post'], detail=True)
    def add(self, request, slug=None):
        product = self.get_object()

        product.quantity += 1
        product.save()

        serializer = ProductSerializer(product)
        return Response(serializer.data)

    @action(methods=['post'], detail=True)
    def take(self, request, slug=None):
        product = self.get_object()

        QuantityValidator.validate_integrity(product)

        product.quantity -= 1
        product.save()

        serializer = ProductSerializer(product)
        return Response(serializer.data)
