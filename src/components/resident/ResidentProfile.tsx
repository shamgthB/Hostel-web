import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';
import {
  User,
  DoorClosed,
  Bed,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Users,
} from 'lucide-react';

export const ResidentProfile: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getResidentSummary();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-stone-500">Loading your profile...</div>;
  }

  if (!data) {
    return <div className="p-6 bg-rose-50 text-rose-700 rounded-xl text-xs">Profile unavailable.</div>;
  }

  const resident = data?.resident || {};
  const room = data?.room || null;
  const bed = data?.bed || null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={resident.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={resident.fullName}
            className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-xs"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-stone-900">{resident.fullName}</h2>
              <StatusBadge status={resident.status} />
            </div>
            <p className="text-xs text-stone-500">{resident.email}</p>
            <div className="flex flex-wrap gap-2 text-xs pt-1">
              <span className="px-2.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-800">
                Room {room?.roomNumber || resident.roomNumber} (Floor {room?.floor})
              </span>
              <span className="px-2.5 py-0.5 rounded bg-stone-100 font-semibold text-stone-800">
                Bed #{bed?.bedNumber || resident.bedNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Contact Details */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Contact & Registration</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Mobile Number
              </span>
              <span className="font-semibold text-stone-800">{resident.mobileNumber}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="font-semibold text-stone-800">{resident.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Emergency Contact
              </span>
              <span className="font-semibold text-stone-800">{resident.emergencyContact || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Joining Date
              </span>
              <span className="font-semibold font-mono text-stone-800">{resident.joiningDate}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">ID Verification</span>
              <span className="font-semibold text-stone-800">{resident.idType}: {resident.idNumber || 'Verified'}</span>
            </div>

            <div className="py-1">
              <span className="text-stone-500 block mb-1">Permanent Home Address</span>
              <span className="font-medium text-stone-700">{resident.permanentAddress}, {resident.city}</span>
            </div>
          </div>
        </div>

        {/* Room & Tenancy Terms */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Room & Tenancy Details</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5" /> Room Configuration
              </span>
              <span className="font-semibold text-stone-800">
                Room {room?.roomNumber} &bull; {room?.roomType} Type
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5" /> Bed Assignment
              </span>
              <span className="font-semibold text-stone-800">Bed #{bed?.bedNumber}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Agreed Monthly Rent
              </span>
              <span className="font-mono font-bold text-emerald-700">${resident.monthlyRent} / month</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Security Deposit Paid</span>
              <span className="font-mono font-bold text-stone-800">${resident.securityDeposit}</span>
            </div>

            <div className="py-2">
              <span className="text-stone-500 block mb-2">Room Amenities</span>
              <div className="flex flex-wrap gap-1.5">
                {room?.amenities?.map((amenity: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-700 rounded text-[11px] font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
