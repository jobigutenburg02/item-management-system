from django.urls import path
from .views import ItemListCreateView, ItemRetrieveUpdateDestroyView

urlpatterns = [
    # GET/POST /api/items/
    path('items/', ItemListCreateView.as_view(), name='item-list'), 
    
    # GET/PUT/DELETE /api/items/1/
    path('items/<int:pk>/', ItemRetrieveUpdateDestroyView.as_view(), name='item-detail'),
]