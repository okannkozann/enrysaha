'use client';
import { useState, useEffect } from 'react';
import { FieldTeam, EneryaEmployee, ControlCompany, ControlEmployee } from '@/types';
import { teamService } from '@/lib/services/teamService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface TeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: FieldTeam | null;
  onSuccess: () => void;
}

export function TeamForm({ isOpen, onClose, teamToEdit, onSuccess }: TeamFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [eneryaEmployeeId, setEneryaEmployeeId] = useState('');
  const [controlCompanyId, setControlCompanyId] = useState('');
  const [controlEmployeeId, setControlEmployeeId] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [workType, setWorkType] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Bekliyor' | 'Tamamlandı'>('Aktif');

  // Options State
  const [eneryaEmployees, setEneryaEmployees] = useState<EneryaEmployee[]>([]);
  const [companies, setCompanies] = useState<ControlCompany[]>([]);
  const [controlEmployees, setControlEmployees] = useState<ControlEmployee[]>([]);
  const [locations, setLocations] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen, teamToEdit]);

  const loadFormData = async () => {
    setLoading(true);
    const [emp, comp, loc] = await Promise.all([
      teamService.getEneryaEmployees(),
      teamService.getControlCompanies(),
      teamService.getLocations()
    ]);
    setEneryaEmployees(emp);
    setCompanies(comp);
    setLocations(loc);

    if (teamToEdit) {
      setCode(teamToEdit.code);
      setEneryaEmployeeId(teamToEdit.eneryaEmployee.id);
      setControlCompanyId(teamToEdit.controlCompany.id);
      setDistrict(teamToEdit.district);
      setNeighborhood(teamToEdit.neighborhood);
      setWorkType(teamToEdit.workType);
      setStatus(teamToEdit.status);

      const cEmps = await teamService.getControlEmployees(teamToEdit.controlCompany.id);
      setControlEmployees(cEmps);
      setControlEmployeeId(teamToEdit.controlEmployee.id);
    } else {
      resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCode('');
    setEneryaEmployeeId('');
    setControlCompanyId('');
    setControlEmployeeId('');
    setDistrict('');
    setNeighborhood('');
    setWorkType('');
    setStatus('Aktif');
    setControlEmployees([]);
  };

  const handleCompanyChange = async (cid: string) => {
    setControlCompanyId(cid);
    setControlEmployeeId('');
    const emps = await teamService.getControlEmployees(cid);
    setControlEmployees(emps);
  };

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setNeighborhood('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !eneryaEmployeeId || !controlCompanyId || !controlEmployeeId || !district || !neighborhood || !workType) {
      toast({ title: 'Hata', description: 'Lütfen tüm alanları doldurun.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const eneryaEmp = eneryaEmployees.find(e => e.id === eneryaEmployeeId)!;
      const comp = companies.find(c => c.id === controlCompanyId)!;
      const controlEmp = controlEmployees.find(ce => ce.id === controlEmployeeId)!;

      const teamData = {
        code,
        eneryaEmployee: eneryaEmp,
        controlCompany: comp,
        controlEmployee: controlEmp,
        district,
        neighborhood,
        workType: workType as any,
        status,
        serviceBoxIds: teamToEdit ? teamToEdit.serviceBoxIds : [],
        assignmentDate: teamToEdit ? teamToEdit.assignmentDate : new Date().toISOString().split('T')[0],
      };

      if (teamToEdit) {
        await teamService.updateTeam(teamToEdit.id, teamData);
        toast({ title: 'Başarılı', description: 'Ekip güncellendi.' });
      } else {
        await teamService.createTeam(teamData);
        toast({ title: 'Başarılı', description: 'Yeni ekip oluşturuldu.' });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir sorun oluştu.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teamToEdit ? 'Ekibi Düzenle' : 'Yeni Saha Ekibi Oluştur'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ekip Kodu</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Örn: Ekip 07" />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue placeholder="Durum Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                    <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enerya Personeli</Label>
                <Select value={eneryaEmployeeId} onValueChange={setEneryaEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Personel Seçin" /></SelectTrigger>
                  <SelectContent>
                    {eneryaEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kontrol Firması</Label>
                <Select value={controlCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger><SelectValue placeholder="Firma Seçin" /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kontrol Personeli</Label>
                <Select value={controlEmployeeId} onValueChange={setControlEmployeeId} disabled={!controlCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Personel Seçin" /></SelectTrigger>
                  <SelectContent>
                    {controlEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>İmalat Türü</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger><SelectValue placeholder="Tür Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PE Ana Hat">PE Ana Hat</SelectItem>
                    <SelectItem value="ST Çelik Hat">ST Çelik Hat</SelectItem>
                    <SelectItem value="Servis Hattı">Servis Hattı</SelectItem>
                    <SelectItem value="Servis Kutusu">Servis Kutusu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>İlçe</Label>
                <Select value={district} onValueChange={handleDistrictChange}>
                  <SelectTrigger><SelectValue placeholder="İlçe Seçin" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(locations).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mahalle</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district}>
                  <SelectTrigger><SelectValue placeholder="Mahalle Seçin" /></SelectTrigger>
                  <SelectContent>
                    {district && locations[district].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>İptal</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
