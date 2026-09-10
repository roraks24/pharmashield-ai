import React from 'react';
import FormField from '../common/FormField';

const ProductDetails = () => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 uppercase tracking-wide">
      2. PRODUCT & BATCH IDENTIFICATION
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField name="product_name" label="Product Name" />
      <FormField name="product_strength_grade" label="Product Strength/Grade" />
      <FormField name="batch_number" label="Batch/Lot Number" />
      <FormField name="manufacturing_date" label="Manufacturing Date" type="date" />
      <FormField name="expiry_date" label="Expiry Date" type="date" />
      <FormField name="quantity_affected" label="Quantity Affected" suffix="kg" />
    </div>
  </div>
);

export default ProductDetails;
