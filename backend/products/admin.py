from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'unit', 'minimum_quantity')
    prepopulated_fields = {'slug': ('name',)}

