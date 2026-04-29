import { useState, useEffect } from 'react';
import { 
  subscribeToProducts, 
  subscribeToOrders, 
  updateProductStatus, 
  updateOrderStatus,
  addProduct,
  updateProduct,
  deleteProduct
} from '../services/marketplaceService';
import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageUploader from '../components/ImageUploader';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Marketplace({ searchQuery = '' }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('Products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New Product Form
  const [newProd, setNewProd] = useState({ name: '', price: '', category: 'Tech ', imageUrl: '', description: '', images: [] });

  useEffect(() => {
    const unsubProducts = subscribeToProducts((err, data) => {
      if (!err) setProducts(data);
    });
    const unsubOrders = subscribeToOrders((err, data) => {
      if (!err) setOrders(data);
      setLoading(false);
    });
    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const handleSetGallery = (urls) => {
    setNewProd(prev => ({ 
      ...prev, 
      imageUrl: urls[0] || '',
      images: urls 
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProd.name,
        price: parseFloat(newProd.price),
        category: newProd.category,
        description: newProd.description,
        imageUrl: newProd.images[0] || '',
        images: newProd.images
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        alert('Innovation updated successfully!');
      } else {
        await addProduct({
          ...payload,
          sellerId: 'admin',
          status: 'approved'
        });
        alert('Innovation listed successfully!');
      }
      
      setNewProd({ name: '', price: '', category: 'Tech ', imageUrl: '', description: '', images: [] });
      setShowAddForm(false);
      setEditingId(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setNewProd({
      name: p.name,
      price: p.price,
      category: p.category,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      images: p.images || (p.imageUrl ? [p.imageUrl] : [])
    });
    setEditingId(p.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this innovation? This action cannot be undone.')) {
      try {
        await deleteProduct(id);
        alert('Product deleted successfully.');
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const productRows = filteredProducts.map(p => [
    <div className="flex-center">
      <div className="prod-avatar" style={{ backgroundImage: `url(${p.imageUrl || (p.images && p.images[0])})` }} />
      <div className="prod-meta">
        <span className="prod-name">{p.name}</span>
        <span className="prod-id">ID: {p.id.substring(0,8)}</span>
      </div>
    </div>,
    <span className="category-tag">{p.category}</span>,
    <span className="price-bold">${p.price?.toLocaleString()}</span>,
    <div className={`status-indicator ${p.status === 'approved' ? 'status-ok' : 'status-warn'}`}>
      <span className="dot" />
      {p.status?.toUpperCase()}
    </div>,
    <div className="flex-center gap-2">
      <button className="action-pill pill-edit" onClick={() => handleEdit(p)}>Edit</button>
      <button 
        className={`action-pill ${p.status === 'approved' ? 'pill-danger' : 'pill-success'}`}
        onClick={() => updateProductStatus(p.id, p.status === 'approved' ? 'pending' : 'approved')}
      >
        {p.status === 'approved' ? 'Revoke' : 'Approve'}
      </button>
      <button className="action-pill pill-delete" onClick={() => handleDelete(p.id)}>Delete</button>
    </div>
  ]);

  const orderRows = orders.map(o => [
    <div className="order-ref">
      <span className="ref-hash">#</span>
      <span className="ref-id">{o.id.substring(0,8).toUpperCase()}</span>
    </div>,
    <div className="item-stack">
       <span className="item-count">{o.items?.length || 0} Products</span>
       <span className="item-sub">By: {o.userId?.substring(0,8)}</span>
    </div>,
    <span className="total-gold">${o.total?.toLocaleString()}</span>,
    <div className={`status-indicator status-${o.status}`}>
       <span className="dot" />
       {o.status?.toUpperCase()}
    </div>,
    <select 
      value={o.status} 
      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
      className="admin-select"
    >
      <option value="pending"> Pending</option>
      <option value="shipped"> Shipped</option>
      <option value="delivered"> Delivered</option>
    </select>
  ]);

  return (
    <section className="page-card professional-admin">
      <div className="page-header-flex">
        <div className="header-info">
          <h3>Marketplace Governance</h3>
          <p>Real-time oversight of platform inventory, approvals, and order fulfillment.</p>
        </div>
        <button className="btn-glass-primary" onClick={() => {
          setShowAddForm(!showAddForm);
          if (showAddForm) {
            setEditingId(null);
            setNewProd({ name: '', price: '', category: 'Tech ', imageUrl: '', description: '', images: [] });
          }
        }}>
          {showAddForm ? 'Close Editor' : 'Create New Listing'}
        </button>
      </div>

      <div className="stats-row">
         <Card title="Marketplace Value" value={`$${products.reduce((a,b) => a + (b.price || 0), 0).toLocaleString()}`} trend="Total inventory value" tone="blue" />
         <Card title="Pending Review" value={products.filter(p => p.status === 'pending').length} trend="Needs attention" tone="amber" />
         <Card title="Active Sales" value={orders.filter(o => o.status !== 'delivered').length} trend="In fulfillment" tone="teal" />
      </div>

      {showAddForm && (
        <article className="professional-form-card">
          <form className="grid-form" onSubmit={handleAddProduct}>
            <h4>{editingId ? 'Edit Innovation Details' : 'Inventory Control: New Item'}</h4>
            <div className="form-grid">
              <div className="input-group">
                <label>Innovation Name</label>
                <input placeholder="e.g. Bio-Nano Battery" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Target Price (USD)</label>
                <input placeholder="0.00" type="number" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})}>
                  <option value="Tech ">Tech </option>
                  <option value="Food ">Food </option>
                  <option value="Fashion ">Fashion </option>
                  <option value="Services ">Services </option>
                </select>
              </div>
              <div className="input-group">
                <label>Inventory Gallery</label>
                <ImageUploader 
                  setGallery={handleSetGallery} 
                  existingImages={newProd.images} 
                />
              </div>
            </div>
            
            <div className="input-group full-width">
              <label>Service Description</label>
              <textarea placeholder="Technical specifications and value proposition..." value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} />
            </div>

            <div className="form-actions">
               <button type="submit" className="btn-action-primary" disabled={uploading}>
                 {editingId ? 'Save Changes' : 'Publish to Marketplace'}
               </button>
               <button type="button" className="btn-glass-secondary" onClick={() => { setShowAddForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </article>
      )}

      <div className="table-controls">
        <div className="tab-pill-group">
          <button className={activeSubTab === 'Products' ? 'active' : ''} onClick={() => setActiveSubTab('Products')}>Products</button>
          <button className={activeSubTab === 'Orders' ? 'active' : ''} onClick={() => setActiveSubTab('Orders')}>Orders</button>
        </div>
        
        {activeSubTab === 'Products' && (
          <div className="filter-group">
            <span className="filter-label">Filter:</span>
            <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>All</button>
            <button className={filterStatus === 'pending' ? 'active' : ''} onClick={() => setFilterStatus('pending')}>Pending</button>
            <button className={filterStatus === 'approved' ? 'active' : ''} onClick={() => setFilterStatus('approved')}>Approved</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-center p-20"><div className="loading-spinner" /></div>
      ) : activeSubTab === 'Products' ? (
        <Table columns={['Product Detail', 'Sector', 'Price', 'Status', 'Control']} rows={productRows} />
      ) : (
        <Table columns={['Ref Code', 'Payload', 'Settlement', 'Stage', 'Dispatch']} rows={orderRows} />
      )}
    </section>
  );
}
