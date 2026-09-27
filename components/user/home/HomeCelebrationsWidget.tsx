/**
 * @file HomeCelebrationsWidget.tsx
 * @description React component for rendering HomeCelebrationsWidget UI.
 * @module components
 * @author Hirush Global AMS
 * @last_modified 2026
 */

import React from 'react';
import Card from '../../common/Card';
import { PartyPopper, Gift, Award } from 'lucide-react';
import { User } from '../../../types';

interface HomeCelebrationsWidgetProps {
  birthdays: { user: User, dateStr: string, isToday: boolean }[];
  workAnniversaries: { user: User, years: number, dateStr: string, isToday: boolean }[];
  wishedUsers: Set<string>;
  handleSendWish: (targetUser: User, type: 'birthday' | 'anniversary', years?: number) => void;
}

const HomeCelebrationsWidget: React.FC<HomeCelebrationsWidgetProps> = ({
  birthdays,
  workAnniversaries,
  wishedUsers,
  handleSendWish
}) => {
  return (
    <Card className="h-full bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <PartyPopper size={24} className="text-pink-500" />
          <h3 className="text-xl font-bold text-slate-800">Celebrations</h3>
        </div>

        <div className="space-y-8">
          {/* Birthdays Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gift size={16} /> Upcoming Birthdays
            </h4>
            {birthdays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {birthdays.map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 border rounded-2xl shadow-sm hover:shadow-md transition-shadow ${item.isToday ? 'bg-pink-50/50 border-pink-100' : 'bg-white border-slate-100'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden ${item.isToday ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>
                      {item.user.profilePhoto ? (
                        <img src={item.user.profilePhoto} alt={item.user.name} className="w-full h-full object-cover" />
                      ) : (
                        item.user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.user.name}</p>
                      <p className={`text-xs font-semibold ${item.isToday ? 'text-pink-500' : 'text-slate-400'}`}>
                        {item.isToday ? 'Today!' : item.dateStr}
                      </p>
                    </div>
                    {item.isToday && (
                      <button
                        onClick={() => !wishedUsers.has(item.user.id + 'birthday') && handleSendWish(item.user, 'birthday')}
                        disabled={wishedUsers.has(item.user.id + 'birthday')}
                        className={`ml-auto text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${wishedUsers.has(item.user.id + 'birthday') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'}`}
                      >
                        {wishedUsers.has(item.user.id + 'birthday') ? 'Wished!' : 'Wish'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-medium">No upcoming birthdays</p>
              </div>
            )}
          </div>

          {/* Anniversaries Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={16} /> Work Anniversaries
            </h4>
            {workAnniversaries.length > 0 ? (
              <div className="space-y-3">
                {workAnniversaries.map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 border rounded-2xl ${item.isToday ? 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100' : 'bg-white border-slate-100'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.isToday ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Award size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.user.name}</p>
                      <p className="text-xs text-slate-500">Celebrating <span className={`font-bold ${item.isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{item.years} year{item.years !== 1 ? 's' : ''}</span> {item.isToday ? 'today' : `on ${item.dateStr}`}</p>
                    </div>
                    {item.isToday && (
                      <button
                        onClick={() => !wishedUsers.has(item.user.id + 'anniversary') && handleSendWish(item.user, 'anniversary', item.years)}
                        disabled={wishedUsers.has(item.user.id + 'anniversary')}
                        className={`ml-auto text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${wishedUsers.has(item.user.id + 'anniversary') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
                      >
                        {wishedUsers.has(item.user.id + 'anniversary') ? 'Wished!' : 'Wish'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-medium">No upcoming anniversaries</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HomeCelebrationsWidget;
