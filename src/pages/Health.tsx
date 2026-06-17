import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HeartPulse, Plus, AlertCircle, Calendar, Syringe, Pill, 
  Scale, Clock, CheckCircle2, TrendingUp, X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { healthApi, petApi } from '../api';
import type { HealthReminder, Pet } from '../types';
import { formatDate, formatDateTime, calculateDaysUntil } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function Health() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const petIdParam = searchParams.get('petId');
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccine' | 'deworming' | 'weight'>('overview');
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [vaccineRecords, setVaccineRecords] = useState<any[]>([]);
  const [dewormingRecords, setDewormingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'vaccine' | 'deworming' | 'weight'>('vaccine');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, location.key]);

  useEffect(() => {
    if (pets.length > 0) {
      if (petIdParam) {
        setSelectedPetId(parseInt(petIdParam));
      } else {
        setSelectedPetId(pets[0]?.id || null);
      }
    }
  }, [pets, petIdParam]);

  useEffect(() => {
    if (selectedPetId) {
      loadRecords();
    }
  }, [selectedPetId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [petsRes, remindersRes] = await Promise.all([
        petApi.getAll(),
        healthApi.getReminders(),
      ]);
      setPets(petsRes.pets);
      setReminders(remindersRes.reminders);
    } catch (e) {
      console.error('Load data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    if (!selectedPetId) return;
    try {
      const [weightRes, vaccineRes, dewormingRes] = await Promise.all([
        healthApi.getWeightRecords(selectedPetId),
        healthApi.getVaccineRecords(selectedPetId),
        healthApi.getDewormingRecords(selectedPetId),
      ]);
      setWeightRecords(weightRes.records);
      setVaccineRecords(vaccineRes.records);
      setDewormingRecords(dewormingRes.records);
    } catch (e) {
      console.error('Load records error:', e);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      if (addType === 'vaccine') {
        await healthApi.addVaccineRecord({
          petId: selectedPetId,
          name: formData.get('name') as string,
          date: formData.get('date') as string,
          nextDate: formData.get('nextDate') as string,
          hospital: formData.get('hospital') as string,
          note: formData.get('note') as string,
        });
      } else if (addType === 'deworming') {
        await healthApi.addDewormingRecord({
          petId: selectedPetId,
          type: formData.get('type') as 'internal' | 'external',
          date: formData.get('date') as string,
          nextDate: formData.get('nextDate') as string,
          product: formData.get('product') as string,
          note: formData.get('note') as string,
        });
      } else if (addType === 'weight') {
        await healthApi.addWeightRecord({
          petId: selectedPetId,
          weight: parseFloat(formData.get('weight') as string),
          date: formData.get('date') as string,
          note: formData.get('note') as string,
        });
      }
      
      setShowAddModal(false);
      loadData();
      loadRecords();
    } catch (e) {
      console.error('Add record error:', e);
    }
  };

  if (!isAuthenticated) return null;

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const weightChartData = [...weightRecords].reverse().map(r => ({
    date: formatDate(r.date),
    weight: r.weight,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">健康记录</h2>
            <p className="text-neutral-500 mt-1">管理爱宠的健康数据，及时获取提醒</p>
          </div>
        </div>

        {pets.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-2xl transition-all flex-shrink-0',
                  selectedPetId === pet.id
                    ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                )}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={pet.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="font-medium">{pet.name}</span>
              </button>
            ))}
          </div>
        )}

        {reminders.length > 0 && (
          <div className="bg-white rounded-3xl shadow-soft p-6">
            <h3 className="font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              即将到期提醒
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reminders.map((reminder, idx) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'p-4 rounded-2xl flex items-center gap-4',
                    reminder.daysLeft <= 7 
                      ? 'bg-red-50 border border-red-200' 
                      : reminder.daysLeft <= 15
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-secondary-50 border border-secondary-200'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    reminder.type === 'vaccine' ? 'bg-blue-100' : 'bg-green-100'
                  )}>
                    {reminder.type === 'vaccine' 
                      ? <Syringe className="w-6 h-6 text-blue-600" />
                      : <Pill className="w-6 h-6 text-green-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800">{reminder.title}</div>
                    <div className="text-sm text-neutral-500">{formatDate(reminder.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-2xl font-bold',
                      reminder.daysLeft <= 7 ? 'text-red-500' : reminder.daysLeft <= 15 ? 'text-amber-500' : 'text-secondary-500'
                    )}>
                      {reminder.daysLeft}
                    </div>
                    <div className="text-xs text-neutral-400">天后</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="flex border-b border-neutral-100">
            {[
              { id: 'overview', label: '概览', icon: HeartPulse },
              { id: 'vaccine', label: '疫苗', icon: Syringe },
              { id: 'deworming', label: '驱虫', icon: Pill },
              { id: 'weight', label: '体重', icon: Scale },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-secondary-600 border-b-2 border-secondary-500 bg-secondary-50/50'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && selectedPet && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary-500" />
                    体重趋势
                  </h4>
                  {weightRecords.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#4CAF50" 
                            strokeWidth={2}
                            dot={{ fill: '#4CAF50', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      暂无体重记录
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                    <Syringe className="w-6 h-6 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{vaccineRecords.length}</div>
                    <div className="text-sm text-blue-500">疫苗记录</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                    <Pill className="w-6 h-6 text-green-500 mb-2" />
                    <div className="text-2xl font-bold text-green-600">{dewormingRecords.length}</div>
                    <div className="text-sm text-green-500">驱虫记录</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                    <Scale className="w-6 h-6 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{weightRecords.length}</div>
                    <div className="text-sm text-purple-500">体重记录</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vaccine' && (
              <div className="space-y-4">
                {vaccineRecords.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    暂无疫苗记录
                  </div>
                ) : (
                  vaccineRecords.map((record, idx) => (
                    <div key={record.id} className="p-4 bg-neutral-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-neutral-800">{record.name}</div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-500">{formatDate(record.date)}</div>
                          {record.createdAt && (
                            <div className="text-xs text-neutral-400">{formatDateTime(record.createdAt)}</div>
                          )}
                        </div>
                      </div>
                      {record.hospital && (
                        <div className="text-sm text-neutral-500 mb-1">医院：{record.hospital}</div>
                      )}
                      {record.nextDate && (
                        <div className="flex items-center gap-2 text-sm text-secondary-600 mt-2">
                          <Clock className="w-4 h-4" />
                          下次：{formatDate(record.nextDate)}
                          ({calculateDaysUntil(record.nextDate) > 0 
                            ? `${calculateDaysUntil(record.nextDate)}天后` 
                            : '已过期'}
                          )
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'deworming' && (
              <div className="space-y-4">
                {dewormingRecords.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    暂无驱虫记录
                  </div>
                ) : (
                  dewormingRecords.map((record, idx) => (
                    <div key={record.id} className="p-4 bg-neutral-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-neutral-800">
                          {record.type === 'internal' ? '体内驱虫' : '体外驱虫'}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-500">{formatDate(record.date)}</div>
                          {record.createdAt && (
                            <div className="text-xs text-neutral-400">{formatDateTime(record.createdAt)}</div>
                          )}
                        </div>
                      </div>
                      {record.product && (
                        <div className="text-sm text-neutral-500 mb-1">药物：{record.product}</div>
                      )}
                      {record.nextDate && (
                        <div className="flex items-center gap-2 text-sm text-secondary-600 mt-2">
                          <Clock className="w-4 h-4" />
                          下次：{formatDate(record.nextDate)}
                          ({calculateDaysUntil(record.nextDate) > 0 
                            ? `${calculateDaysUntil(record.nextDate)}天后` 
                            : '已过期'}
                          )
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'weight' && (
              <div className="space-y-4">
                {weightRecords.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    暂无体重记录
                  </div>
                ) : (
                  weightRecords.map((record, idx) => (
                    <div key={record.id} className="p-4 bg-neutral-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-800">{record.weight} kg</div>
                        <div className="text-sm text-neutral-500">
                          {formatDate(record.date)}
                          {record.createdAt && (
                            <span className="text-neutral-400 text-xs ml-2">{formatDateTime(record.createdAt)}</span>
                          )}
                        </div>
                      </div>
                      {record.note && (
                        <div className="text-sm text-neutral-500">{record.note}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setAddType('vaccine'); setShowAddModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              >
                <Syringe className="w-4 h-4" />
                疫苗
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setAddType('deworming'); setShowAddModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
              >
                <Pill className="w-4 h-4" />
                驱虫
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setAddType('weight'); setShowAddModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors"
              >
                <Scale className="w-4 h-4" />
                体重
              </motion.button>
            </div>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-neutral-800">
                  添加{addType === 'vaccine' ? '疫苗' : addType === 'deworming' ? '驱虫' : '体重'}记录
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-4">
                {addType === 'vaccine' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">疫苗名称 *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="如：猫三联"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">接种医院</label>
                      <input
                        type="text"
                        name="hospital"
                        placeholder="请输入医院名称"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {addType === 'deworming' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">驱虫类型 *</label>
                      <div className="flex gap-3">
                        <label className="flex-1">
                          <input type="radio" name="type" value="internal" defaultChecked className="hidden" />
                          <div className="w-full py-3 text-center bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors border-2 border-transparent has-[:checked]:border-secondary-400 has-[:checked]:bg-secondary-50">
                            体内驱虫
                          </div>
                        </label>
                        <label className="flex-1">
                          <input type="radio" name="type" value="external" className="hidden" />
                          <div className="w-full py-3 text-center bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors border-2 border-transparent has-[:checked]:border-secondary-400 has-[:checked]:bg-secondary-50">
                            体外驱虫
                          </div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">驱虫药物</label>
                      <input
                        type="text"
                        name="product"
                        placeholder="请输入药物名称"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {addType === 'weight' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">体重 (kg) *</label>
                    <input
                      type="number"
                      name="weight"
                      step="0.1"
                      required
                      placeholder="请输入体重"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">日期 *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={formatDate(new Date())}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                  />
                </div>

                {addType !== 'weight' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">下次提醒日期</label>
                    <input
                      type="date"
                      name="nextDate"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">备注</label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="请输入备注信息（可选）"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  保存记录
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
