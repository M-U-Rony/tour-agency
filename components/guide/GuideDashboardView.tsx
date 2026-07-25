"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  MapPin,
  Clock,
  Calendar,
  Users,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  User,
  Megaphone,
  Send,
  X,
  Check,
  XCircle,
  HelpCircle,
  Filter,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import { formatBdt } from "@/lib/tour-package";
import type { CustomTripRequestDTO } from "@/lib/custom-trip";
import { formatTravelDate } from "@/lib/booking";

type TripAnnouncementItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  guideName?: string;
};

type BookingRosterItem = {
  id: string;
  userName: string;
  userEmail: string;
  contactPhone: string;
  emergencyContact: string;
  travelers: number;
  travelerNames: string[];
  notes: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "advance_due" | "advance_paid" | "paid" | "refunded";
  attendanceStatus: "unchecked" | "attending" | "not_coming";
  createdAt: string;
};

type AssignedTour = {
  id: string;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  imageUrl: string;
  startDate?: string;
  endDate?: string;
  availableDates?: string[];
  totalSeats?: number;
  availableSeats?: number;
  isActive?: boolean;
  totalConfirmedTravelers: number;
  bookings: BookingRosterItem[];
  announcements?: TripAnnouncementItem[];
};

export default function GuideDashboardView() {
  const [tours, setTours] = useState<AssignedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null);

  // Broadcast modal state
  const [broadcastTour, setBroadcastTour] = useState<AssignedTour | null>(null);
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [customTrips, setCustomTrips] = useState<CustomTripRequestDTO[]>([]);

  async function loadAssignedTours() {
    setLoading(true);
    try {
      const res = await fetch("/api/guide/tours", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const loaded: AssignedTour[] = data.tours ?? [];
        setTours(loaded);
        setCustomTrips(data.customTrips ?? []);
        if (loaded.length > 0 && !expandedTourId) {
          setExpandedTourId(loaded[0].id);
        }
      }
    } catch {
      setTours([]);
      setCustomTrips([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssignedTours();
  }, []);

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTour || !bTitle.trim() || !bMessage.trim()) return;
    setSending(true);
    setToastMessage(null);
    try {
      const res = await fetch("/api/guide/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: broadcastTour.id,
          title: bTitle.trim(),
          message: bMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ type: "err", text: data.message ?? "Failed to post broadcast announcement." });
        return;
      }
      setToastMessage({
        type: "ok",
        text: `Notice posted! Notification sent to ${data.notifiedCount} booked traveler(s).`,
      });
      setBTitle("");
      setBMessage("");
      setBroadcastTour(null);
      await loadAssignedTours();
    } catch {
      setToastMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  }

  // Attendance filter state
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "attending" | "not_coming" | "unchecked">("all");
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<string | null>(null);

  async function handleUpdateAttendance(bookingId: string, status: "unchecked" | "attending" | "not_coming") {
    setUpdatingAttendanceId(bookingId);
    // Optimistic update
    setTours((prevTours) =>
      prevTours.map((t) => ({
        ...t,
        bookings: t.bookings.map((b) =>
          b.id === bookingId ? { ...b, attendanceStatus: status } : b
        ),
      }))
    );

    try {
      await fetch("/api/guide/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingId, attendanceStatus: status }),
      });
    } catch {
      // Revert if error
      await loadAssignedTours();
    } finally {
      setUpdatingAttendanceId(null);
    }
  }

  function cleanPhoneForWhatsapp(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("880")) return cleaned;
    if (cleaned.startsWith("0")) return `88${cleaned}`;
    return cleaned;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Compass className="text-teal-700" size={26} />
            My Assigned Tours
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View your assigned tour packages, passenger rosters, and broadcast notices to booked travelers.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-800 border border-teal-100">
          {tours.length} {tours.length === 1 ? "Tour Assigned" : "Tours Assigned"}
        </span>
      </div>

      {toastMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            toastMessage.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-700" />
        </div>
      ) : tours.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Compass size={32} />
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">No tours assigned yet</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            You currently have no active or upcoming tours assigned by the agency administrator. Once assigned, your tour packages and traveler lists will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tours.map((tour) => {
            const isExpanded = expandedTourId === tour.id;
            const confirmedBookings = tour.bookings.filter(
              (b) => b.status === "confirmed" || b.status === "pending"
            );

            const attendingTravelers = tour.bookings
              .filter((b) => b.attendanceStatus === "attending")
              .reduce((sum, b) => sum + b.travelers, 0);

            const notComingTravelers = tour.bookings
              .filter((b) => b.attendanceStatus === "not_coming")
              .reduce((sum, b) => sum + b.travelers, 0);

            const pendingCheckinTravelers = tour.bookings
              .filter((b) => !b.attendanceStatus || b.attendanceStatus === "unchecked")
              .reduce((sum, b) => sum + b.travelers, 0);

            const filteredBookings = tour.bookings.filter((b) => {
              if (attendanceFilter === "attending") return b.attendanceStatus === "attending";
              if (attendanceFilter === "not_coming") return b.attendanceStatus === "not_coming";
              if (attendanceFilter === "unchecked") return !b.attendanceStatus || b.attendanceStatus === "unchecked";
              return true;
            });

            return (
              <div
                key={tour.id}
                className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Package Main Banner */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="relative h-44 w-full md:w-64 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tour.imageUrl}
                      alt={tour.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        <MapPin size={12} /> {tour.location}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md border border-teal-100">
                          <Clock size={12} /> {tour.duration}
                        </span>
                        {tour.startDate && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                            <Calendar size={12} />
                            {new Date(tour.startDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 truncate">
                        {tour.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-teal-800">
                        {formatBdt(tour.priceBdt)} <span className="text-xs font-normal text-slate-500">/ person</span>
                      </p>
                    </div>

                    {/* Quick Stats Badges & Broadcast Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-[#f4fbf8] px-3 py-1.5 rounded-lg border border-emerald-100">
                          <Users size={14} className="text-teal-700" />
                          <span>{tour.totalConfirmedTravelers} Total Confirmed Passengers</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <span>{confirmedBookings.length} Booking Group(s)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setToastMessage(null);
                          setBTitle("");
                          setBMessage("");
                          setBroadcastTour(tour);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Megaphone size={14} />
                        Broadcast Trip Notice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Roster Header Toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedTourId(isExpanded ? null : tour.id)}
                  className="w-full flex items-center justify-between gap-2 border-t border-emerald-100 bg-[#f4fbf8] px-5 py-3.5 text-sm font-bold text-slate-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-teal-700" />
                    Passenger Roster & Announcements ({tour.bookings.length} Bookings)
                  </span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Roster & Announcements List */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-slate-50/50 border-t border-emerald-100 space-y-6">
                    {/* Attendance Summary Bar */}
                    <div className="rounded-xl border border-emerald-100 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-emerald-600" size={18} />
                          <h4 className="text-sm font-bold text-slate-900">Passenger Attendance Tracker</h4>
                        </div>
                        {/* Attendance Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setAttendanceFilter("all")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                              attendanceFilter === "all"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            All ({tour.bookings.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceFilter("attending")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                              attendanceFilter === "attending"
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            Present ({attendingTravelers})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceFilter("not_coming")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                              attendanceFilter === "not_coming"
                                ? "bg-red-700 text-white"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            Not Coming ({notComingTravelers})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceFilter("unchecked")}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                              attendanceFilter === "unchecked"
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            Pending ({pendingCheckinTravelers})
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-100">
                          <span className="text-lg font-extrabold text-emerald-800">{attendingTravelers}</span>
                          <p className="text-[11px] font-semibold text-emerald-700">Present / Coming</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-2.5 border border-red-100">
                          <span className="text-lg font-extrabold text-red-700">{notComingTravelers}</span>
                          <p className="text-[11px] font-semibold text-red-600">Not Coming / Absent</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 p-2.5 border border-slate-200">
                          <span className="text-lg font-extrabold text-slate-700">{pendingCheckinTravelers}</span>
                          <p className="text-[11px] font-semibold text-slate-600">Pending Check-in</p>
                        </div>
                      </div>
                    </div>

                    {/* Posted Announcements Section */}
                    {tour.announcements && tour.announcements.length > 0 && (
                      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 space-y-3">
                        <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Megaphone size={14} className="text-teal-700" /> Posted Announcements ({tour.announcements.length})
                        </h4>
                        <div className="grid gap-2">
                          {tour.announcements.map((ann) => (
                            <div key={ann.id} className="rounded-lg bg-white p-3 border border-teal-100/80 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className="text-xs font-bold text-slate-900">{ann.title}</h5>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(ann.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap">{ann.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredBookings.length === 0 ? (
                      <div className="py-8 text-center bg-white rounded-xl border border-slate-100">
                        <AlertCircle size={24} className="mx-auto text-slate-400" />
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          No matching passengers found
                        </p>
                        <p className="text-xs text-slate-500">
                          {attendanceFilter === "all"
                            ? "When users book this package, their contact info will appear here."
                            : `No passengers marked as ${attendanceFilter.replace("_", " ")}.`}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredBookings.map((b) => {
                          const waPhone = cleanPhoneForWhatsapp(b.contactPhone);
                          const isUpdating = updatingAttendanceId === b.id;

                          return (
                            <div
                              key={b.id}
                              className={`rounded-xl border p-4 shadow-2xs space-y-3 transition-colors ${
                                b.attendanceStatus === "attending"
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : b.attendanceStatus === "not_coming"
                                  ? "border-red-200 bg-red-50/20"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              {/* Top Bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                                    <User size={15} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {b.userName || "Traveler"}
                                    </h4>
                                    <p className="text-xs text-slate-500">{b.userEmail}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Attendance Badge */}
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1 ${
                                      b.attendanceStatus === "attending"
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : b.attendanceStatus === "not_coming"
                                        ? "bg-red-600 text-white shadow-2xs"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {b.attendanceStatus === "attending" ? (
                                      <>
                                        <Check size={13} /> PRESENT / COMING
                                      </>
                                    ) : b.attendanceStatus === "not_coming" ? (
                                      <>
                                        <XCircle size={13} /> NOT COMING / ABSENT
                                      </>
                                    ) : (
                                      <>
                                        <HelpCircle size={13} /> PENDING CHECK-IN
                                      </>
                                    )}
                                  </span>

                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                                    {b.travelers} {b.travelers === 1 ? "Seat" : "Seats"}
                                  </span>
                                </div>
                              </div>

                              {/* Details & Contact Buttons */}
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                                <div>
                                  <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">
                                    Primary Contact Phone
                                  </span>
                                  <p className="font-bold text-slate-800 mt-0.5">
                                    {b.contactPhone}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">
                                    Emergency Contact
                                  </span>
                                  <p className="font-bold text-slate-800 mt-0.5">
                                    {b.emergencyContact || "Not provided"}
                                  </p>
                                </div>

                                {b.travelerNames.length > 0 && (
                                  <div className="sm:col-span-2 lg:col-span-1">
                                    <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">
                                      Passenger Name(s)
                                    </span>
                                    <p className="font-medium text-slate-800 mt-0.5">
                                      {b.travelerNames.join(", ")}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {b.notes && (
                                <div className="rounded-lg bg-amber-50/70 p-2.5 border border-amber-100 text-xs text-amber-900">
                                  <strong className="font-semibold">Special Request / Notes:</strong> {b.notes}
                                </div>
                              )}

                              {/* Action Buttons: Check-in & Contact */}
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                                {/* Check-In Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-500 mr-1">Check-in:</span>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleUpdateAttendance(b.id, "attending")}
                                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                      b.attendanceStatus === "attending"
                                        ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500"
                                        : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                  >
                                    <Check size={13} /> Present / Coming
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleUpdateAttendance(b.id, "not_coming")}
                                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                      b.attendanceStatus === "not_coming"
                                        ? "bg-red-700 text-white shadow-sm ring-2 ring-red-500"
                                        : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    }`}
                                  >
                                    <XCircle size={13} /> Not Coming
                                  </button>
                                  {b.attendanceStatus !== "unchecked" && (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => void handleUpdateAttendance(b.id, "unchecked")}
                                      className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>

                                {/* Contact Shortcuts */}
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${b.contactPhone}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Phone size={12} /> Call
                                  </a>
                                  {waPhone && (
                                    <a
                                      href={`https://wa.me/${waPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
                                    >
                                      <MessageCircle size={12} /> WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assigned Custom Trips Section */}
      {customTrips.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-emerald-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-teal-700" size={22} />
              Assigned Custom Trip Requests ({customTrips.length})
            </h3>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
              Tailor-made itineraries
            </span>
          </div>

          <div className="grid gap-4">
            {customTrips.map((ct) => {
              const waPhone = cleanPhoneForWhatsapp(ct.phone);
              return (
                <div key={ct.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{ct.destination}</h4>
                      <p className="text-xs text-slate-500">{ct.tripType} • Budget: {ct.budget}</p>
                    </div>
                    <span className="self-start sm:self-auto rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-100">
                      {ct.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">Travel Dates</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {formatTravelDate(ct.departureDate)} - {formatTravelDate(ct.returnDate)}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">Travelers</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {ct.travelers} Adult(s) {ct.children ? `+ ${ct.children} Child(ren)` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">Contact Info</span>
                      <p className="font-bold text-slate-800 mt-0.5">{ct.name} ({ct.phone})</p>
                    </div>
                  </div>

                  {ct.notes && (
                    <div className="rounded-xl bg-[#f4fbf8] p-3 text-xs text-slate-700">
                      <strong className="font-semibold">Notes:</strong> {ct.notes}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${ct.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone size={13} /> Call Traveler
                    </a>
                    {waPhone && (
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Broadcast Notice Modal */}
      {broadcastTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="text-teal-700" size={20} />
                Broadcast Trip Notice
              </h3>
              <button
                type="button"
                onClick={() => setBroadcastTour(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Posting to: <strong className="text-slate-800">{broadcastTour.title}</strong>
              <br />
              This notice will be displayed on all booked travelers' dashboards and in their notification dropdown.
            </p>

            <form onSubmit={(e) => void handleSendBroadcast(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus Departure Time & Gathering Point"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Notice Details / Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Dear travelers, gather at Dhaka Bus Stand by 7:30 AM tomorrow. Please bring your NID copy and warm clothes."
                  value={bMessage}
                  onChange={(e) => setBMessage(e.target.value)}
                  className="w-full resize-y rounded-xl border border-emerald-100 bg-[#f4fbf8] p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastTour(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !bTitle.trim() || !bMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {sending ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
