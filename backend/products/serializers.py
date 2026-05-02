from rest_framework import serializers
from .models import Product


from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'quantity', 'slug', 'unit', 'unit_display', 'minimum_quantity']
