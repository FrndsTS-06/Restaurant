import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('savoria_auth_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      let sessionId = localStorage.getItem('savoria_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        localStorage.setItem('savoria_session_id', sessionId);
      }
      headers.set('x-session-id', sessionId);
      return headers;
    }
  }),
  keepUnusedDataFor: 120, // Cache query data for 2 minutes to eliminate repeated roundtrips
  refetchOnFocus: false, // Prevent aggressive network requests on tab focus
  tagTypes: [
    'Health', 'Menu', 'Category', 'Order', 'Reservation', 'User', 'Table',
    'Coupon', 'Settings', 'Cart', 'Customer', 'Staff', 'Payment', 'Dashboard',
    'Review', 'Notification', 'Contact'
  ],
  endpoints: (builder) => ({
    // Health Check
    getHealth: builder.query({
      query: () => '/health',
      providesTags: ['Health']
    }),

    // Category Endpoints
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category']
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData
      }),
      invalidatesTags: ['Category', 'Menu']
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Category', 'Menu']
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Category', 'Menu']
    }),

    // Menu Item Endpoints
    getMenuItems: builder.query({
      query: (params = {}) => {
        const cleanParams = {};
        Object.keys(params).forEach((key) => {
          if (params[key] !== undefined && params[key] !== '' && params[key] !== 'All') {
            cleanParams[key] = params[key];
          }
        });
        const queryParams = new URLSearchParams(cleanParams).toString();
        return `/menu${queryParams ? `?${queryParams}` : ''}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Menu', id: _id })),
              { type: 'Menu', id: 'LIST' }
            ]
          : [{ type: 'Menu', id: 'LIST' }]
    }),
    getMenuItemById: builder.query({
      query: (id) => `/menu/${id}`,
      providesTags: (result, error, id) => [{ type: 'Menu', id }]
    }),
    createMenuItem: builder.mutation({
      query: (dishData) => ({
        url: '/menu',
        method: 'POST',
        body: dishData
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }]
    }),
    updateMenuItem: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/menu/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Menu', id },
        { type: 'Menu', id: 'LIST' }
      ]
    }),
    deleteMenuItem: builder.mutation({
      query: (id) => ({
        url: `/menu/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }]
    }),

    // Image Upload to Cloudinary
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData
      })
    }),

    // 3D Model Upload (.glb/.gltf) with Deep Validation
    upload3DModel: builder.mutation({
      query: (formData) => ({
        url: '/upload/model3d',
        method: 'POST',
        body: formData
      })
    }),

    // 3D Poster Image Upload
    upload3DPoster: builder.mutation({
      query: (formData) => ({
        url: '/upload/poster',
        method: 'POST',
        body: formData
      })
    }),

    // Safe 3D Model Deletion
    delete3DModel: builder.mutation({
      query: (filename) => ({
        url: `/upload/model3d/${filename}`,
        method: 'DELETE'
      })
    }),

    // Cart Endpoints
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart']
    }),
    addItemToCart: builder.mutation({
      query: (itemData) => ({
        url: '/cart/items',
        method: 'POST',
        body: itemData
      }),
      invalidatesTags: ['Cart']
    }),
    updateCartItem: builder.mutation({
      query: ({ itemId, ...data }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Cart']
    }),
    removeCartItem: builder.mutation({
      query: (itemId) => ({
        url: `/cart/items/${itemId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Cart']
    }),
    updateCartOrderType: builder.mutation({
      query: (orderType) => ({
        url: '/cart/order-type',
        method: 'PUT',
        body: { orderType }
      }),
      invalidatesTags: ['Cart']
    }),
    applyCartCoupon: builder.mutation({
      query: (code) => ({
        url: '/cart/apply-coupon',
        method: 'POST',
        body: { code }
      }),
      invalidatesTags: ['Cart']
    }),
    clearCart: builder.mutation({
      query: () => ({
        url: '/cart',
        method: 'DELETE'
      }),
      invalidatesTags: ['Cart']
    }),
    mergeCart: builder.mutation({
      query: (sessionId) => ({
        url: '/cart/merge',
        method: 'POST',
        body: { sessionId }
      }),
      invalidatesTags: ['Cart']
    }),

    // Orders
    getOrders: builder.query({
      query: (status) => (status ? `/orders?status=${status}` : '/orders'),
      providesTags: ['Order']
    }),
    getMyOrders: builder.query({
      query: (email) => (email ? `/orders/my-orders?email=${encodeURIComponent(email)}` : '/orders/my-orders'),
      providesTags: ['Order']
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }]
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData
      }),
      invalidatesTags: ['Order', 'Cart']
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order']
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, note }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status, note }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order']
    }),

    // Reservations
    getReservations: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);
        if (params.status && params.status !== 'All') queryParams.append('status', params.status);
        const qs = queryParams.toString();
        return `/reservations${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Reservation']
    }),
    getReservationAvailability: builder.query({
      query: ({ date, guestsCount = 2 }) => `/reservations/availability?date=${encodeURIComponent(date)}&guestsCount=${guestsCount}`,
      providesTags: ['Reservation']
    }),
    getMyReservations: builder.query({
      query: (email) => (email ? `/reservations/my-reservations?email=${encodeURIComponent(email)}` : '/reservations/my-reservations'),
      providesTags: ['Reservation']
    }),
    createReservation: builder.mutation({
      query: (reservationData) => ({
        url: '/reservations',
        method: 'POST',
        body: reservationData
      }),
      invalidatesTags: ['Reservation', 'Table']
    }),
    cancelReservation: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/reservations/${id}/cancel`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['Reservation', 'Table']
    }),
    updateReservationStatus: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/reservations/${id}/status`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: ['Reservation', 'Table']
    }),

    // Tables
    getTables: builder.query({
      query: () => '/tables',
      providesTags: ['Table']
    }),
    createTable: builder.mutation({
      query: (tableData) => ({
        url: '/tables',
        method: 'POST',
        body: tableData
      }),
      invalidatesTags: ['Table']
    }),
    updateTable: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/tables/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Table']
    }),
    toggleBlockTable: builder.mutation({
      query: ({ id, isBlocked, blockedReason }) => ({
        url: `/tables/${id}/block`,
        method: 'PATCH',
        body: { isBlocked, blockedReason }
      }),
      invalidatesTags: ['Table', 'Reservation']
    }),
    deleteTable: builder.mutation({
      query: (id) => ({
        url: `/tables/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Table']
    }),

    // Settings
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings']
    }),
    updateSettings: builder.mutation({
      query: (settingsData) => ({
        url: '/settings',
        method: 'PUT',
        body: settingsData
      }),
      invalidatesTags: ['Settings', 'Reservation']
    }),

    // Admin Dashboard & Analytics
    getAdminAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: ['Dashboard', 'Order', 'Reservation']
    }),

    // Admin Customer Management
    getAdminCustomers: builder.query({
      query: (params) => ({
        url: '/admin/customers',
        params
      }),
      providesTags: ['Customer']
    }),
    updateCustomerStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/customers/${id}/status`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['Customer']
    }),

    // Admin Staff Management
    getAdminStaff: builder.query({
      query: (params) => ({
        url: '/admin/staff',
        params
      }),
      providesTags: ['Staff']
    }),
    createAdminStaff: builder.mutation({
      query: (staffData) => ({
        url: '/admin/staff',
        method: 'POST',
        body: staffData
      }),
      invalidatesTags: ['Staff']
    }),
    updateAdminStaff: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/admin/staff/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Staff']
    }),
    deleteAdminStaff: builder.mutation({
      query: (id) => ({
        url: `/admin/staff/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Staff']
    }),

    // Admin Payments Management
    getAdminPayments: builder.query({
      query: (params) => ({
        url: '/admin/payments',
        params
      }),
      providesTags: ['Payment']
    }),
    refundAdminPayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/admin/payments/${id}/refund`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Payment', 'Order', 'Dashboard']
    }),

    // Admin Reports
    getAdminReport: builder.query({
      query: ({ type, ...params }) => ({
        url: `/admin/reports/${type}`,
        params
      })
    }),

    // Public Payments
    getPaymentConfig: builder.query({
      query: () => '/payments/config'
    }),
    createPaymentOrder: builder.mutation({
      query: (payload) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: payload
      })
    }),
    verifyPayment: builder.mutation({
      query: (payload) => ({
        url: '/payments/verify',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Order', 'Payment', 'Dashboard']
    }),
    recordPaymentFailure: builder.mutation({
      query: (payload) => ({
        url: '/payments/record-failure',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Payment']
    }),

    // Dish Reviews
    getReviewsForDish: builder.query({
      query: (dishId) => `/reviews/dish/${dishId}`,
      providesTags: ['Review']
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: '/reviews',
        method: 'POST',
        body: reviewData
      }),
      invalidatesTags: ['Review', 'Menu', 'Dashboard']
    }),
    getAllReviews: builder.query({
      query: (params) => ({
        url: '/reviews',
        params
      }),
      providesTags: ['Review']
    }),
    updateReviewStatus: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/reviews/${id}/status`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: ['Review', 'Menu']
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Review', 'Menu']
    }),

    // Coupon Management
    getCoupons: builder.query({
      query: () => '/coupons',
      providesTags: ['Coupon']
    }),
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: '/coupons',
        method: 'POST',
        body: couponData
      }),
      invalidatesTags: ['Coupon']
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/coupons/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Coupon']
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Coupon']
    }),

    // Transactional Notifications
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params
      }),
      providesTags: ['Notification']
    }),
    retryNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/retry`,
        method: 'POST'
      }),
      invalidatesTags: ['Notification']
    }),

    // Accessible Contact Inquiries
    submitContactForm: builder.mutation({
      query: (payload) => ({
        url: '/contact',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Contact']
    }),
    getContactMessages: builder.query({
      query: (params) => ({
        url: '/contact',
        params
      }),
      providesTags: ['Contact']
    }),
    updateContactStatus: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/contact/${id}/status`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: ['Contact']
    }),
    deleteContactMessage: builder.mutation({
      query: (id) => ({
        url: `/contact/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Contact']
    })
  })
});

export const {
  useGetHealthQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMenuItemsQuery,
  useGetMenuItemByIdQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useUploadImageMutation,
  useUpload3DModelMutation,
  useUpload3DPosterMutation,
  useDelete3DModelMutation,
  useGetCartQuery,
  useAddItemToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useUpdateCartOrderTypeMutation,
  useApplyCartCouponMutation,
  useClearCartMutation,
  useMergeCartMutation,
  useGetOrdersQuery,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useGetReservationsQuery,
  useGetReservationAvailabilityQuery,
  useGetMyReservationsQuery,
  useCreateReservationMutation,
  useCancelReservationMutation,
  useUpdateReservationStatusMutation,
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useToggleBlockTableMutation,
  useDeleteTableMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminCustomersQuery,
  useUpdateCustomerStatusMutation,
  useGetAdminStaffQuery,
  useCreateAdminStaffMutation,
  useUpdateAdminStaffMutation,
  useDeleteAdminStaffMutation,
  useGetAdminPaymentsQuery,
  useRefundAdminPaymentMutation,
  useGetAdminReportQuery,
  useGetPaymentConfigQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useRecordPaymentFailureMutation,
  useGetReviewsForDishQuery,
  useCreateReviewMutation,
  useGetAllReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useGetNotificationsQuery,
  useRetryNotificationMutation,
  useSubmitContactFormMutation,
  useGetContactMessagesQuery,
  useUpdateContactStatusMutation,
  useDeleteContactMessageMutation
} = apiSlice;


