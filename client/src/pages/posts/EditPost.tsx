import React from 'react';

interface EditPostProps {
  id: number;
}

export function EditPost({ id }: EditPostProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Edit Post #{id}</h1>
      <p className="text-gray-500">This feature is coming soon!</p>
    </div>
  );
} 