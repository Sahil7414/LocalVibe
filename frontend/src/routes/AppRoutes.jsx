import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LandingPage } from '../pages/LandingPage';
import { DiscoverPage } from '../pages/DiscoverPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { CreateEventPage } from '../pages/CreateEventPage';
import { MyEventsPage } from '../pages/MyEventsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="events/:id" element={<EventDetailsPage />} />

        {/* Authenticated User & Organizer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="create-event" element={<CreateEventPage />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Administrator Routes */}
        <Route element={<ProtectedRoute requiredRoles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
