import React from 'react';

interface PostDetailsProps {
  id: number;
}

export function PostDetails({ id }: PostDetailsProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Post #{id} Details</h1>
      <p className="text-gray-500">This feature is coming soon!</p>
    </div>
  );
} 