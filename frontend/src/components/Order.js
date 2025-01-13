// src/components/OrderHistoryPage.js

import React, { useState, useEffect } from 'react';
import './OrderHistory.css'; // <-- Updated import
import Layout from './Layout';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Modal Component
const Modal = ({ show, onClose, children }) => {
  // Close modal on 'Esc' key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="order-modal-close-button" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="order-star-rating">
      {[...Array(5)].map((star, index) => {
        index += 1;
        return (
          <button
            type="button"
            key={index}
            className={index <= (hover || rating) ? 'on' : 'off'}
            onClick={() => setRating(index)}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(rating)}
            aria-label={`${index} Star`}
          >
            <span className="star">&#9733;</span>
          </button>
        );
      })}
    </div>
  );
};

const ProductItem = ({ product, onClick, refundStatus, orderId }) => {
  const [isRefunding, setIsRefunding] = useState(false);

  const imageUrl = `${product.photo}`;
  // Fallback image URL
  const fallbackImage = 'https://via.placeholder.com/150';

  const handleRefundClick = async () => {
    setIsRefunding(true);
    try {
      const response = await axios.post('http://localhost:5000/api/create_refund', {
        orderId,
        products: [{ productId: product._id }]
      });
      console.log('Refund request created successfully:', response.data);
      alert(response.data.message);
    } catch (error) {
      console.error('Error creating refund request:', error);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="order-product-item" onClick={() => onClick(product)}>
      <img
        src={imageUrl}
        alt={product.name}
        className="order-product-image"
        onError={(e) => {
          e.target.src = fallbackImage;
        }}
      />
      <div className="order-product-details">
        <h4 className="order-product-name">{product.name}</h4>
        <p>Quantity: {product.quantity}</p>
        <p>Price: ${product.price.toFixed(2)}</p>
        <button
          className="refund-button"
          onClick={(e) => {
            e.stopPropagation();
            handleRefundClick();
          }}
          disabled={refundStatus !== 'neutral' || isRefunding}
        >
          Request Refund
        </button>
      </div>
    </div>
  );
};

const OrderCard = ({ order, onProductClick, onCancelOrder }) => {
  const [showProducts, setShowProducts] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false); // Yeni state

  const toggleProducts = () => {
    setShowProducts((prev) => !prev);
  };

  // Format date
  const formattedDate = new Date(order.purchaseDate).toLocaleDateString();

  // Determine status color
  const statusClass = order.status.toLowerCase().replace(' ', '-');

  // Handler for cancel button
  const handleCancel = async (e) => {
    e.stopPropagation(); // Butonun kartı tıklamayı tetiklemesini engelle
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setIsCancelling(true);
      try {
        await onCancelOrder(order._id);
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel the order. Please try again later.');
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <div className="order-history-card">
      <div className="order-history-summary" onClick={toggleProducts}>
        <div className="order-info-grid">
          <div className="order-info-item">
            <span className="info-label">Order ID</span>
            <span className="info-data">{order._id}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Date</span>
            <span className="info-data">{formattedDate}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Status</span>
            <span className={`status ${statusClass}`}>{order.status}</span>
          </div>
          <div className="order-info-item">
            <span className="info-label">Total</span>
            <span className="info-data">
              $
              {order.products
                .reduce((total, p) => total + p.price * p.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
        <div className="order-toggle-icon">
          {showProducts ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="order-icon order-icon-up"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="order-icon order-icon-down"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="24"
              height="24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>
      {showProducts && (
        <div className="order-products-list">
          {order.products.map((item) => (
            <ProductItem
              key={item.product._id}
              product={{
                ...item.product,
                price: item.price, // Pass the purchase price from the order schema
                quantity: item.quantity,
              }}
              refundStatus={item.refund_status} // Pass the refund status
              orderId={order._id} // Pass the order ID
              onClick={() => onProductClick(item.product, order.status)}
            />
          ))}
          {/* "Cancel" Button Eklemek */}
          {order.status === 'Processing' && (
            <div className="refund-button-container">
              <button
                className="cancel-button"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main OrderHistoryPage component
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = localStorage.getItem('userId'); // Assuming userId is in localStorage

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${userId}`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  // Function to handle order cancellation
  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/orders/cancel/${orderId}`);
      if (response.status === 200) {
        // Update the specific order's status in the state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId ? { ...order, status: 'Cancelled' } : order
          )
        );
        alert('Order cancelled successfully.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error; // Rethrow to handle in the calling function
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler to open modal with product details
  const handleProductClick = (product, orderStatus) => {
    console.log("Selected Order Status:", orderStatus);
    setSelectedProduct(product);
    setSelectedOrderStatus(orderStatus);
    setRating(0);
    setComment('');
  };

  // Handler to close modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedOrderStatus(null);
    setRating(0);
    setComment('');
  };

  // Handler to submit comment and rating
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating before submitting your comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/products/${selectedProduct._id}/reviews`,
        {
          userId,
          rating,
          comment,
        }
      );

      if (response.status === 200) {
        // Optionally show success message
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response) {
        alert(error.response.data.message || 'There was an error submitting your review.');
      } else {
        alert('There was an error submitting your review. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <Layout>
      <div className="order-history-page">
        {/* Sidebar */}
        <div className="order-history-sidebar">
          <h3>Menu</h3>
          <ul>
            <li>
              <Link to="/account" className="order-sidebar-link">
                Account Info
              </Link>
            </li>
            <li>
              <Link to="/order" className="order-sidebar-link">
                Order History
              </Link>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="order-history-main">
          <h2>Order History</h2>
          {/* Search Bar */}
          <div className="order-search-bar">
            <input
              type="text"
              placeholder="Search orders by ID or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredOrders.length === 0 ? (
            <p className="order-no-orders">No orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onProductClick={handleProductClick}
                onCancelOrder={cancelOrder} // Passing the cancel function
              />
            ))
          )}
        </div>

        {/* Modal for Product Details */}
        {selectedProduct && (
          <Modal show={!!selectedProduct} onClose={handleCloseModal}>
            <div className="order-modal-product-details">
              <img
                src={selectedProduct.photo}
                alt={selectedProduct.name}
                className="order-modal-product-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
              <div className="order-modal-product-info">
                <h2>{selectedProduct.name}</h2>
                {selectedOrderStatus.toLowerCase() === 'delivered' ? (
                  <p>
                    <strong>Description:</strong>{' '}
                    {selectedProduct.description || 'No description available.'}
                  </p>
                ) : (
                  <p>You cannot write a review before delivery.</p>
                )}
                <Link
                  to={`/product/${selectedProduct._id}`}
                  className="order-modal-view-link"
                  onClick={handleCloseModal}
                >
                  View Product Page
                </Link>
              </div>
            </div>

            <hr className="order-modal-divider" />

            {/* Review Section */}
            <div className="order-modal-review-section">
              <h3>Leave a Review</h3>
              <form onSubmit={handleSubmit} className="order-review-form">
                {/* Star Rating Input */}
                <div className="order-form-group">
                  <label htmlFor="rating">
                    <strong>Rating:</strong>
                  </label>
                  <StarRating rating={rating} setRating={setRating} />
                </div>

                {/* Comment Area */}
                <div className="order-form-group">
                  <label htmlFor="comment">
                    <strong>Comment:</strong>
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                    placeholder="Write your review here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="order-form-group">
                  <button
                    type="submit"
                    className="order-submit-button"
                    disabled={selectedOrderStatus.toLowerCase() !== 'delivered' || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistoryPage;
