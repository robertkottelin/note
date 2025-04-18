import React, { useState, useContext } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { AuthContext } from '../../contexts/AuthContext';
import './AuthForms.css';

const SubscriptionForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState(null);

  const { subscribe, isAuthenticated, currentUser } = useContext(AuthContext);

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsLoading(true);
    setError('');
    setPaymentStep('processing');

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Submit payment method to server for subscription
      const result = await subscribe(paymentMethod.id);

      if (result.success) {
        setPaymentStep('success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Subscription failed');
        setPaymentStep('error');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'An error occurred during the subscription process');
      setPaymentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="subscription-form-container">
      <h2 className="subscription-form-title">Premium Subscription</h2>
      <div className="subscription-benefits">
        <h3>Benefits:</h3>
        <ul>
          <li>Save unlimited assets and portfolios</li>
          <li>Real-time data updates and alerts</li>
          <li>Advanced analytics and reporting</li>
          <li>Priority support</li>
        </ul>
      </div>

      {error && (
        <div className="subscription-error-message">
          {error}
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="subscription-form">
          {currentUser && (
            <div className="subscription-user-info">
              Subscribing as: <strong>{currentUser.email}</strong>
            </div>
          )}

          <div className="form-group card-element-container">
            <label htmlFor="card-element">Credit or debit card</label>
            <CardElement
              id="card-element"
              options={CARD_ELEMENT_OPTIONS}
            />
          </div>

          <div className="subscription-price-info">
            <span className="price">$9.99</span> per month
          </div>

          <button
            type="submit"
            className="subscription-button"
            disabled={!stripe || isLoading}
          >
            {isLoading ? getPaymentStepMessage(paymentStep) : 'Subscribe Now'}
          </button>

          <div className="subscription-terms">
            Cancel anytime. By subscribing, you agree to our Terms of Service.
          </div>
        </form>
      ) : (
        <div className="subscription-auth-required">
          <p>Please sign in or create an account to subscribe.</p>
        </div>
      )}
    </div>
  );
};

// Helper function to get payment step message
const getPaymentStepMessage = (step) => {
  switch (step) {
    case 'processing':
      return 'Processing payment...';
    case 'success':
      return 'Subscription successful!';
    case 'error':
      return 'Payment failed';
    default:
      return 'Processing...';
  }
};

export default SubscriptionForm;