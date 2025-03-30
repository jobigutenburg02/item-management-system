import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Spinner from './components/Spinner';
import { toast } from 'react-toastify';
import './LandingPage.css';

function LandingPage() {
  // State management
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    description: '' 
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // API configuration
  const API_BASE_URL = 'http://localhost:8000/api';
  axios.defaults.baseURL = API_BASE_URL;

  // Fetch items with loading state
  const fetchItemsWithLoading = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/items/', {
        params: {
          page: pagination.page,
          page_size: pagination.pageSize,
          search: searchTerm
        }
      });
      setItems(response.data.results);
      setPagination(prev => ({
        ...prev,
        totalCount: response.data.count
      }));
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchTerm]);

  // Initial data load
  useEffect(() => {
    fetchItemsWithLoading();
  }, [fetchItemsWithLoading]);

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      if (editingId) {
        response = await axios.put(`/items/${editingId}/`, formData);
        setItems(prev => prev.map(item => 
          item.id === editingId ? response.data : item
        ));
        toast.success("Item updated successfully!");
      } else {
        response = await axios.post('/items/', formData);
        toast.success("Item added successfully!");
        // Reset to first page to show the new item
        setPagination(prev => ({ ...prev, page: 1 }));
        // Force refresh to get accurate pagination
        await fetchItemsWithLoading();
      }
      setFormData({ name: '', category: '', description: '' });
      setEditingId(null);
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      toast.error(`Failed to ${editingId ? 'update' : 'add'} item: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle item deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await axios.delete(`/items/${id}/`);
      // Check if we need to go back a page
      if (items.length === 1 && pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        // Refresh current page
        await fetchItemsWithLoading();
      }
      toast.success("Item deleted successfully!");
    } catch (error) {
      console.error("Deletion error:", error.response?.data || error.message);
      toast.error("Failed to delete item");
    }
  };

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category || 'Uncategorized';
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <div className="landing-page">
      <h1>Item Management</h1>

      {/* Search Filter */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingId ? "Edit Item" : "Add New Item"}</h2>
        
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Processing..." : (editingId ? "Update Item" : "Add Item")}
        </button>
      </form>

      {/* Loading State */}
      {isLoading && <Spinner />}

      {/* Grouped Items Tables */}
      {!isLoading && Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="category-group">
            <h3>{category}</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td className="actions">
                      <button 
                        onClick={() => {
                          setFormData(item);
                          setEditingId(item.id);
                        }}
                        className="edit-btn"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="delete-btn"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        !isLoading && <p className="no-items">No items found</p>
      )}

      {/* Pagination Controls */}
      {pagination.totalCount > 0 && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1 || isLoading}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.page} of {Math.ceil(pagination.totalCount / pagination.pageSize)}
          </span>
          
          <button
            disabled={pagination.page * pagination.pageSize >= pagination.totalCount || isLoading}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>

          <select 
            value={pagination.pageSize}
            onChange={(e) => setPagination({
              page: 1,
              pageSize: Number(e.target.value),
              totalCount: pagination.totalCount
            })}
            disabled={isLoading}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default LandingPage;