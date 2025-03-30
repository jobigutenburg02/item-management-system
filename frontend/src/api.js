import axios from 'axios';

const API_URL = 'http://localhost:8000/api/items/'; // Proxy points to Django backend

export const fetchItems = (page = 1, pageSize = 10) => 
    axios.get(`/api/items/?page=${page}&page_size=${pageSize}`); //read
export const createItem = (item) => axios.post(API_URL, item); //create
export const updateItem = (id, item) => axios.put(`${API_URL}${id}/`, item); //update
export const deleteItem = (id) => axios.delete(`${API_URL}${id}/`); //delete