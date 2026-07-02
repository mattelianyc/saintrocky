import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { BookingAvailability } from '@saintrocky/api/models/booking-availability';
import { BookingService } from '@saintrocky/api/models/booking-service';
import { Booking } from '@saintrocky/api/models/booking';

import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

function daysFromNow(days, hour, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

export async function seedBooking() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();

  await connectMongo(mongoUri);

  await Booking.deleteMany({});
  await BookingAvailability.deleteMany({});
  await BookingService.deleteMany({});

  const services = await BookingService.insertMany([
    {
      name: 'Focus Architecture Session',
      slug: 'focus-architecture-session',
      description: 'A strategic deep-work session for product and technical planning.',
      timezone: 'America/New_York',
      durationMinutes: 60,
      stepMinutes: 30,
      bufferMinutes: 15,
      minimumNoticeMinutes: 180,
      bookingWindowDays: 45,
      priceCents: 18000,
      currency: 'USD',
      requiresPayment: true
    },
    {
      name: 'Growth Sprint Planning Call',
      slug: 'growth-sprint-planning-call',
      description: 'Collaborative sprint planning for launch, acquisition, and conversion work.',
      timezone: 'America/Los_Angeles',
      durationMinutes: 45,
      stepMinutes: 15,
      bufferMinutes: 15,
      minimumNoticeMinutes: 120,
      bookingWindowDays: 30,
      priceCents: 0,
      currency: 'USD',
      requiresPayment: false
    },
    {
      name: 'SEO Recovery Teardown',
      slug: 'seo-recovery-teardown',
      description: 'A forensic review of rankings, structure, and missed technical opportunities.',
      timezone: 'UTC',
      durationMinutes: 90,
      stepMinutes: 30,
      bufferMinutes: 30,
      minimumNoticeMinutes: 240,
      bookingWindowDays: 21,
      priceCents: 24000,
      currency: 'USD',
      requiresPayment: true
    }
  ]);

  await BookingAvailability.insertMany([
    {
      serviceId: services[0]._id,
      timezone: services[0].timezone,
      weeklyRules: [
        { dayOfWeek: 1, startMinutes: 540, endMinutes: 960 },
        { dayOfWeek: 3, startMinutes: 540, endMinutes: 960 },
        { dayOfWeek: 4, startMinutes: 600, endMinutes: 1020 }
      ],
      updatedBy: 'seed@saintrocky.local'
    },
    {
      serviceId: services[1]._id,
      timezone: services[1].timezone,
      weeklyRules: [
        { dayOfWeek: 2, startMinutes: 570, endMinutes: 990 },
        { dayOfWeek: 4, startMinutes: 570, endMinutes: 990 }
      ],
      dateOverrides: [
        {
          date: daysFromNow(7, 0),
          isClosed: false,
          windows: [{ startMinutes: 660, endMinutes: 840 }]
        }
      ],
      updatedBy: 'seed@saintrocky.local'
    },
    {
      serviceId: services[2]._id,
      timezone: services[2].timezone,
      weeklyRules: [
        { dayOfWeek: 1, startMinutes: 480, endMinutes: 900 },
        { dayOfWeek: 5, startMinutes: 600, endMinutes: 900 }
      ],
      blackoutDates: [daysFromNow(10, 0)],
      updatedBy: 'seed@saintrocky.local'
    }
  ]);

  await Booking.insertMany([
    {
      serviceId: services[0]._id,
      serviceName: services[0].name,
      timezone: services[0].timezone,
      status: 'confirmed',
      startAt: daysFromNow(-2, 15),
      endAt: daysFromNow(-2, 16),
      customerName: 'Maya Bennett',
      customerEmail: 'maya.bennett@northstarlabs.co',
      notes: 'Wants a system for planning weekly product execution.',
      priceCents: services[0].priceCents,
      currency: services[0].currency,
      requiresPayment: services[0].requiresPayment,
      source: 'admin'
    },
    {
      serviceId: services[1]._id,
      serviceName: services[1].name,
      timezone: services[1].timezone,
      status: 'confirmed',
      startAt: daysFromNow(2, 18),
      endAt: daysFromNow(2, 18, 45),
      customerName: 'Jordan Alvarez',
      customerEmail: 'jordan@signalgrove.com',
      notes: 'Needs launch planning for a new acquisition funnel.',
      priceCents: services[1].priceCents,
      currency: services[1].currency,
      requiresPayment: services[1].requiresPayment,
      source: 'public'
    },
    {
      serviceId: services[2]._id,
      serviceName: services[2].name,
      timezone: services[2].timezone,
      status: 'pending',
      startAt: daysFromNow(5, 13),
      endAt: daysFromNow(5, 14, 30),
      customerName: 'Sofia Turner',
      customerEmail: 'sofia@westharborstudio.com',
      notes: 'Organic traffic dropped after a CMS migration.',
      priceCents: services[2].priceCents,
      currency: services[2].currency,
      requiresPayment: services[2].requiresPayment,
      source: 'public'
    },
    {
      serviceId: services[0]._id,
      serviceName: services[0].name,
      timezone: services[0].timezone,
      status: 'cancelled',
      startAt: daysFromNow(8, 14),
      endAt: daysFromNow(8, 15),
      customerName: 'Ethan Brooks',
      customerEmail: 'ethan@trailgrid.io',
      notes: 'Rescheduled after internal roadmap changes.',
      priceCents: services[0].priceCents,
      currency: services[0].currency,
      requiresPayment: services[0].requiresPayment,
      source: 'public'
    }
  ]);

  await disconnectMongo();
  console.log('[seed] booking seeded: services, availability, bookings');
}

runSeedScript(import.meta.url, seedBooking);
