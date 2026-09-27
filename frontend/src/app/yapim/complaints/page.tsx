'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Complaint } from '@/types';
import { complaintService } from '@/lib/services/complaintService';
import { useToast } from '@/components/ui/use-toast';
import { ComplaintKpi } from '@/components/complaints/ComplaintKpi';
import { ComplaintFilters } from '@/components/complaints/ComplaintFilters';
import { ComplaintTable } from '@/components/complaints/ComplaintTable';
import { ComplaintFormModal } from '@/components/complaints/ComplaintFormModal';
import { ComplaintDetailDrawer } from '@/components/complaints/ComplaintDetailDrawer';
import { MessageSquareWarning, PlusCircle, RefreshCw, Layers } from 'lucide-react';

export type SortOption =
  | 'RECEIVED_DESC'
  | 'RECEIVED_ASC'
  | 'REPEAT_DESC'
  | 'REPEAT_ASC'
  | 'PLANNED_DESC'
  | 'PLANNED_ASC';

export default function ComplaintsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<string[]>([]);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [onlyRepeating, setOnlyRepeating] = useState(false);
  const [sortKey, setSortKey] = useState<SortOption>('RECEIVED_DESC');

  // Modals & Drawers State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await complaintService.getComplaints();
        const types = complaintService.getComplaintTypes();
        if (isMounted) {
          setComplaints(data || []);
          setComplaintTypes(types || []);
        }
      } catch (e) {
        console.error('Load complaints error:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setOnlyRepeating(false);
    setSortKey('RECEIVED_DESC');
  };

  // Filtered & Sorted List Computation
  const filteredComplaints = useMemo(() => {
    const filtered = complaints.filter((c) => {
      // 1. Search term (Şikayet türü, bağlantı nesnesi, adres, isim, iletişim)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesType = c.complaintType.toLowerCase().includes(query);
        const matchesConn = (c.connectionObject || '').toLowerCase().includes(query);
        const matchesAddress = c.address.toLowerCase().includes(query);
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesContact = c.contact.toLowerCase().includes(query);

        if (!matchesType && !matchesConn && !matchesAddress && !matchesName && !matchesContact) {
          return false;
        }
      }

      // 2. Şikayet Türü
      if (selectedType && c.complaintType !== selectedType) {
        return false;
      }

      // 3. Only Repeating
      if (onlyRepeating && c.repeatCount <= 0) {
        return false;
      }

      return true;
    });

    // Sort list
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'RECEIVED_DESC':
          return (b.receivedDate || '').localeCompare(a.receivedDate || '');
        case 'RECEIVED_ASC':
          return (a.receivedDate || '').localeCompare(b.receivedDate || '');
        case 'REPEAT_DESC':
          return b.repeatCount - a.repeatCount;
        case 'REPEAT_ASC':
          return a.repeatCount - b.repeatCount;
        case 'PLANNED_DESC':
          return (b.plannedDate || '').localeCompare(a.plannedDate || '');
        case 'PLANNED_ASC':
          return (a.plannedDate || '').localeCompare(b.plannedDate || '');
        default:
          return 0;
      }
    });
  }, [complaints, searchTerm, selectedType, onlyRepeating, sortKey]);

  // Add or Edit Save Handler
  const handleSaveComplaint = async (data: Omit<Complaint, 'id'>) => {
    if (editingComplaint) {
      // Update existing
      const updated = await complaintService.updateComplaint(editingComplaint.id, data);
      setComplaints((prev) =>
        prev.map((c) => (c.id === editingComplaint.id ? updated : c))
      );
      toast({
        title: 'Başarılı',
        description: 'Şikayet bilgileri güncellendi.',
      });
    } else {
      // Create new
      const created = await complaintService.createComplaint(data);
      setComplaints((prev) => [created, ...prev]);
      toast({
        title: 'Başarılı',
        description: 'Şikayet başarıyla kaydedildi.',
      });
    }

    // Refresh types list in case a new type was added
    setComplaintTypes(complaintService.getComplaintTypes());
    setEditingComplaint(null);
  };

  // Delete Handler
  const handleDeleteComplaint = async (id: string) => {
    await complaintService.deleteComplaint(id);
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: 'Silindi',
      description: 'Şikayet kaydı başarıyla silindi.',
    });
  };

  // Export XLS Handler
  const handleExportXls = () => {
    if (filteredComplaints.length === 0) {
      toast({
        title: 'Uyarı',
        description: 'Aktarılacak kayıt bulunamadı.',
        variant: 'destructive',
      });
      return;
    }

    complaintService.exportComplaintsToXls(filteredComplaints);
    toast({
      title: 'Excel İndirildi',
      description: 'Şikayet listesi Excel (.xls) olarak hazırlandı.',
    });
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-sm font-semibold">Şikayet Listesi Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="h-full max-h-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 gap-3">
      {/* ══ 1. SAYFA BAŞLIĞI ═════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-blue-400" />
            Şikayet Listesi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Abonelerden gelen şikayetlerin merkezi takibi.
          </p>
        </div>
      </div>

      {/* ══ 2. SAYFA ÜST KPI ALANI ═══════════════════════════════════════ */}
      <div className="shrink-0">
        <ComplaintKpi complaints={complaints} />
      </div>

      {/* ══ 3. FİLTRELER & ARAMA & SIRALAMA & AKSİYONLAR ═════════════════ */}
      <div className="shrink-0">
        <ComplaintFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          complaintTypes={complaintTypes}
          onlyRepeating={onlyRepeating}
          onOnlyRepeatingChange={setOnlyRepeating}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          onResetFilters={handleResetFilters}
          onExportXls={handleExportXls}
          onOpenAddModal={() => {
            setEditingComplaint(null);
            setIsFormModalOpen(true);
          }}
          totalFiltered={filteredComplaints.length}
        />
      </div>

      {/* ══ 4. ANA İÇERİK TABLOSU / EMPTY STATE ══════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {complaints.length === 0 ? (
          /* Empty State when no complaints exist at all */
          <div className="h-full rounded-xl border border-slate-700/40 bg-slate-800/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-full bg-slate-800 border border-slate-700 mb-3">
              <Layers className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Henüz kayıtlı şikayet bulunmuyor.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Abonelerden gelen ilk şikayet kaydını eklemek için aşağıdaki butonu kullanabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingComplaint(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              + Şikayet Ekle
            </button>
          </div>
        ) : (
          /* Enterprise Data Table */
          <ComplaintTable
            complaints={filteredComplaints}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
            onEditComplaint={(complaint) => {
              setEditingComplaint(complaint);
              setIsFormModalOpen(true);
            }}
          />
        )}
      </div>

      {/* ══ 5. DİALOG & DRAWER MODALS ═════════════════════════════════════ */}
      {/* Form Modal (Ekle / Düzenle) */}
      <ComplaintFormModal
        open={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingComplaint(null);
        }}
        onSave={handleSaveComplaint}
        editingComplaint={editingComplaint}
        complaintTypes={complaintTypes}
      />

      {/* Detail Drawer (Görüntüle / Düzenle / Sil) */}
      <ComplaintDetailDrawer
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onEdit={(complaint) => {
          setSelectedComplaint(null);
          setEditingComplaint(complaint);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteComplaint}
      />
    </div>
  );
}
