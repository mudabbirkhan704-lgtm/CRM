import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { University } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState } from '@/components/ui';
import { UNIVERSITY_ENGLISH_TESTS } from '@/lib/constants';
import { Building2, Search, Plus, Globe, ExternalLink, MapPin, PoundSterling, Upload, Download, Filter, X, Check, Award, Wallet, GraduationCap } from 'lucide-react';
import * as XLSX from 'xlsx';

export function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [scholarshipMin, setScholarshipMin] = useState('');
  const [scholarshipMax, setScholarshipMax] = useState('');
  const [casMin, setCasMin] = useState('');
  const [casMax, setCasMax] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<University | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const pageSize = 24;

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('universities').select('*', { count: 'exact' });
    if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    if (partnerFilter) query = query.eq('partner_status', partnerFilter);
    if (cityFilter) query = query.eq('city', cityFilter);
    if (testFilter) query = query.contains('accepted_tests', [testFilter]);
    if (scholarshipMin) query = query.gte('scholarship_min', Number(scholarshipMin));
    if (scholarshipMax) query = query.lte('scholarship_max', Number(scholarshipMax));
    if (casMin) query = query.gte('cas_deposit_min', Number(casMin));
    if (casMax) query = query.lte('cas_deposit_max', Number(casMax));
    query = query.order('name', { ascending: true }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count } = await query;
    setUniversities((data as University[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, partnerFilter, cityFilter, testFilter, scholarshipMin, scholarshipMax, casMin, casMax, page]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('universities').select('city').not('city', 'is', null);
      const uniqueCities = [...new Set((data ?? []).map((d: any) => d.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    })();
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = partnerFilter || cityFilter || testFilter || scholarshipMin || scholarshipMax || casMin || casMax;
  const clearFilters = () => {
    setPartnerFilter(''); setCityFilter(''); setTestFilter('');
    setScholarshipMin(''); setScholarshipMax(''); setCasMin(''); setCasMax('');
  };

  const partnerBadge = (status: string) => {
    const map: Record<string, string> = {
      preferred: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      partner: 'bg-blue-100 text-blue-700 border-blue-200',
      non_partner: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return map[status] ?? map.partner;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">University Database</h1>
          <p className="text-sm text-gray-500 mt-1">{total} universities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Add University</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search universities..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filters
            {hasFilters ? <span className="w-2 h-2 bg-blue-500 rounded-full" /> : null}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Partner Status</label>
              <select value={partnerFilter} onChange={(e) => { setPartnerFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="preferred">Preferred</option>
                <option value="partner">Partner</option>
                <option value="non_partner">Non-Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">English Test Accepted</label>
              <select value={testFilter} onChange={(e) => { setTestFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Tests</option>
                {UNIVERSITY_ENGLISH_TESTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Scholarship Min %</label>
                <input type="number" value={scholarshipMin} onChange={(e) => { setScholarshipMin(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Max %</label>
                <input type="number" value={scholarshipMax} onChange={(e) => { setScholarshipMax(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">CAS Deposit Min</label>
                <input type="number" value={casMin} onChange={(e) => { setCasMin(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Max</label>
                <input type="number" value={casMax} onChange={(e) => { setCasMax(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-3.5 h-3.5" /> Clear Filters</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : universities.length === 0 ? (
        <EmptyState icon={<Building2 className="w-7 h-7" />} title="No universities found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => (
            <Card key={uni.id} className="p-5 hover:shadow-md transition cursor-pointer" >
              <div onClick={() => setSelected(uni)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className={partnerBadge(uni.partner_status)}>{uni.partner_status.replace('_', ' ')}</Badge>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{uni.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> {uni.city ? `${uni.city}, ` : ''}{uni.location ?? uni.campus ?? '—'}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {uni.tuition_fee != null && (
                    <span className="flex items-center gap-1"><PoundSterling className="w-3.5 h-3.5" /> {formatCurrency(uni.tuition_fee)}/yr</span>
                  )}
                  {uni.cas_deposit != null && (
                    <span>CAS: {formatCurrency(uni.cas_deposit)}</span>
                  )}
                </div>
                {uni.scholarship_min != null && uni.scholarship_max != null && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                    <Award className="w-3.5 h-3.5" /> Scholarship: {uni.scholarship_min}%–{uni.scholarship_max}%
                  </div>
                )}
                {uni.accepted_tests && uni.accepted_tests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {uni.accepted_tests.map((t) => (
                      <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{t.toUpperCase()}</span>
                    ))}
                  </div>
                )}
                {uni.courses?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {uni.courses.slice(0, 3).map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c}</span>
                    ))}
                    {uni.courses.length > 3 && <span className="text-xs text-gray-400">+{uni.courses.length - 3} more</span>}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && <UniversityDetail university={selected} onClose={() => setSelected(null)} />}
      {showCreate && <UniversityFormModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetch(); }} />}
      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} onSuccess={() => { setShowBulkUpload(false); fetch(); }} />}
    </div>
  );
}

function UniversityDetail({ university, onClose }: { university: University; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={university.name} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <DetailField label="Campus" value={university.campus} />
          <DetailField label="Location" value={university.location} />
          <DetailField label="Country" value={university.country} />
          <DetailField label="City" value={university.city} />
          <DetailField label="Tuition Fee" value={university.tuition_fee != null ? formatCurrency(university.tuition_fee) : null} />
          <DetailField label="CAS Deposit" value={university.cas_deposit != null ? formatCurrency(university.cas_deposit) : null} />
          <DetailField label="Application Fee" value={university.application_fee != null ? formatCurrency(university.application_fee) : null} />
          <DetailField label="Processing Time" value={university.processing_time} />
          <DetailField label="UKVI Rating" value={university.ukvi_rating} />
        </div>

        {/* English test scores */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Accepted English Tests & Minimum Scores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {UNIVERSITY_ENGLISH_TESTS.map((t) => {
              const score = (university as any)[`${t.value}_score`];
              const accepted = university.accepted_tests?.includes(t.value);
              return (
                <div key={t.value} className={cn('flex items-center justify-between p-2.5 rounded-lg border', accepted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100')}>
                  <div className="flex items-center gap-2">
                    {accepted ? <Check className="w-4 h-4 text-blue-600" /> : <X className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  </div>
                  {score != null && <span className="text-sm text-gray-500">{score}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scholarship range */}
        {(university.scholarship_min != null || university.scholarship_max != null) && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Scholarship Range</p>
            <p className="text-sm text-gray-700">{university.scholarship_min ?? '—'}% – {university.scholarship_max ?? '—'}%</p>
          </div>
        )}

        {university.scholarships && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Scholarships</p>
            <p className="text-sm text-gray-700">{university.scholarships}</p>
          </div>
        )}

        {university.courses?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Courses</p>
            <div className="flex flex-wrap gap-2">
              {university.courses.map((c, i) => <span key={i} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">{c}</span>)}
            </div>
          </div>
        )}

        {university.intakes?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Intakes</p>
            <div className="flex flex-wrap gap-2">
              {university.intakes.map((int, i) => <span key={i} className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-lg">{int}</span>)}
            </div>
          </div>
        )}

        {university.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{university.notes}</p>
          </div>
        )}

        {university.website && (
          <a href={university.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function UniversityFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', campus: '', location: '', city: '', country: '', website: '', application_link: '',
    scholarships: '', cas_deposit: '', tuition_fee: '', application_fee: '',
    scholarship_min: '', scholarship_max: '',
    processing_time: '', english_requirement: '', ukvi_rating: '', partner_status: 'partner', notes: '',
    courses: '', intakes: '',
  });
  const [acceptedTests, setAcceptedTests] = useState<string[]>([]);
  const [testScores, setTestScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleTest = (test: string) => {
    const next = new Set(acceptedTests);
    if (next.has(test)) next.delete(test); else next.add(test);
    setAcceptedTests([...next]);
  };

  const setScore = (test: string, value: string) => {
    setTestScores((s) => ({ ...s, [test]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const scoreFields: Record<string, number | null> = {};
    for (const test of UNIVERSITY_ENGLISH_TESTS) {
      const key = `${test.value}_score`;
      scoreFields[key] = testScores[test.value] ? Number(testScores[test.value]) : null;
    }
    const { error: insError } = await supabase.from('universities').insert({
      name: form.name,
      campus: form.campus || null,
      location: form.location || null,
      city: form.city || null,
      country: form.country || null,
      website: form.website || null,
      application_link: form.application_link || null,
      scholarships: form.scholarships || null,
      cas_deposit: form.cas_deposit ? Number(form.cas_deposit) : null,
      tuition_fee: form.tuition_fee ? Number(form.tuition_fee) : null,
      application_fee: form.application_fee ? Number(form.application_fee) : null,
      scholarship_min: form.scholarship_min ? Number(form.scholarship_min) : null,
      scholarship_max: form.scholarship_max ? Number(form.scholarship_max) : null,
      processing_time: form.processing_time || null,
      english_requirement: form.english_requirement || null,
      ukvi_rating: form.ukvi_rating || null,
      partner_status: form.partner_status,
      notes: form.notes || null,
      courses: form.courses ? form.courses.split(',').map((c) => c.trim()) : [],
      intakes: form.intakes ? form.intakes.split(',').map((c) => c.trim()) : [],
      accepted_tests: acceptedTests,
      ...scoreFields,
    });
    if (insError) { setError(insError.message); setSaving(false); return; }
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add University" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Campus" value={form.campus} onChange={(v) => set('campus', v)} />
          <Input label="Location" value={form.location} onChange={(v) => set('location', v)} />
          <Input label="City" value={form.city} onChange={(v) => set('city', v)} />
          <Input label="Country" value={form.country} onChange={(v) => set('country', v)} />
          <Input label="Website" value={form.website} onChange={(v) => set('website', v)} />
          <Input label="Tuition Fee" value={form.tuition_fee} onChange={(v) => set('tuition_fee', v)} type="number" />
          <Input label="CAS Deposit" value={form.cas_deposit} onChange={(v) => set('cas_deposit', v)} type="number" />
          <Input label="Application Fee" value={form.application_fee} onChange={(v) => set('application_fee', v)} type="number" />
          <Select label="Partner Status" value={form.partner_status} onChange={(v) => set('partner_status', v)} options={[{ value: 'preferred', label: 'Preferred' }, { value: 'partner', label: 'Partner' }, { value: 'non_partner', label: 'Non-Partner' }]} />
          <Input label="Scholarship Min %" value={form.scholarship_min} onChange={(v) => set('scholarship_min', v)} type="number" />
          <Input label="Scholarship Max %" value={form.scholarship_max} onChange={(v) => set('scholarship_max', v)} type="number" />
          <Input label="Processing Time" value={form.processing_time} onChange={(v) => set('processing_time', v)} />
          <Input label="UKVI Rating" value={form.ukvi_rating} onChange={(v) => set('ukvi_rating', v)} />
        </div>

        {/* English test acceptance with scores */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accepted English Tests</label>
          <p className="text-xs text-gray-500 mb-2">Click to toggle acceptance. Enter minimum score for each accepted test.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {UNIVERSITY_ENGLISH_TESTS.map((t) => {
              const accepted = acceptedTests.includes(t.value);
              return (
                <div key={t.value} className={cn('p-3 rounded-lg border transition', accepted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100')}>
                  <button type="button" onClick={() => toggleTest(t.value)} className="flex items-center gap-2 w-full mb-2">
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition', accepted ? 'bg-blue-600 border-blue-600' : 'border-gray-300')}>
                      {accepted && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn('text-sm font-medium', accepted ? 'text-blue-700' : 'text-gray-400')}>{t.label}</span>
                  </button>
                  {accepted && (
                    <input
                      type="number"
                      value={testScores[t.value] ?? ''}
                      onChange={(e) => setScore(t.value, e.target.value)}
                      placeholder="Min score"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Input label="Courses (comma separated)" value={form.courses} onChange={(v) => set('courses', v)} placeholder="Computer Science, MBA, Law" />
        <Input label="Intakes (comma separated)" value={form.intakes} onChange={(v) => set('intakes', v)} placeholder="September 2025, January 2026" />
        <Textarea label="Scholarships Description" value={form.scholarships} onChange={(v) => set('scholarships', v)} rows={2} />
        <Textarea label="Notes" value={form.notes} onChange={(v) => set('notes', v)} rows={2} />
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add University'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function BulkUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [stage, setStage] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState('');

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (data.length === 0) { setErrors(['The file is empty or has no data rows.']); return; }
      setRows(data);
      setStage('preview');
    } catch {
      setErrors(['Could not read the file. Please ensure it is a valid CSV or Excel file.']);
    }
  };

  const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

  const handleImport = async () => {
    setImporting(true);
    setErrors([]);
    let success = 0;
    const newErrors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const raw: Record<string, any> = {};
      for (const [k, v] of Object.entries(rows[i])) { raw[normalizeKey(k)] = v; }
      const name = raw.name || raw.university_name || '';
      if (!name) { newErrors.push(`Row ${i + 2}: Missing name`); continue; }
      const acceptedTests: string[] = [];
      for (const t of UNIVERSITY_ENGLISH_TESTS) {
        if (raw[t.value] || raw[t.label.toLowerCase().replace(/\s/g, '_')] || raw[`${t.value}_accepted`]) {
          acceptedTests.push(t.value);
        }
      }
      const { error } = await supabase.from('universities').insert({
        name,
        campus: raw.campus || null,
        location: raw.location || null,
        city: raw.city || null,
        country: raw.country || null,
        website: raw.website || null,
        tuition_fee: raw.tuition_fee ? Number(raw.tuition_fee) : null,
        cas_deposit: raw.cas_deposit ? Number(raw.cas_deposit) : null,
        application_fee: raw.application_fee ? Number(raw.application_fee) : null,
        scholarship_min: raw.scholarship_min ? Number(raw.scholarship_min) : null,
        scholarship_max: raw.scholarship_max ? Number(raw.scholarship_max) : null,
        partner_status: raw.partner_status || 'partner',
        courses: raw.courses ? String(raw.courses).split(',').map((c: string) => c.trim()) : [],
        intakes: raw.intakes ? String(raw.intakes).split(',').map((c: string) => c.trim()) : [],
        accepted_tests: acceptedTests,
      });
      if (error) newErrors.push(`Row ${i + 2} (${name}): ${error.message}`);
      else success++;
    }
    setImportedCount(success);
    setErrors(newErrors);
    setImporting(false);
    setStage('done');
  };

  const downloadTemplate = () => {
    const template = [{
      Name: 'University of Example',
      City: 'London',
      Country: 'United Kingdom',
      TuitionFee: '15000',
      CASDeposit: '3000',
      ScholarshipMin: '0',
      ScholarshipMax: '50',
      PartnerStatus: 'partner',
      Courses: 'Computer Science, MBA',
      IELTS: 'yes',
      PTE: 'yes',
      TOEFL: '',
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Universities');
    XLSX.writeFile(wb, 'universities_template.xlsx');
  };

  return (
    <Modal open onClose={onClose} title="Bulk Upload Universities" size="lg">
      {stage === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Upload a CSV or Excel file with university data.</p>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4" /> Template</Button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition cursor-pointer" onClick={(e) => { const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement; input?.click(); }}>
            <GraduationCap className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Click to select a CSV or Excel file</p>
            <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
          </div>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}
      {stage === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{fileName}</p>
              <p className="text-xs text-gray-500">{rows.length} universities ready to import</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStage('upload'); setRows([]); setErrors([]); }}>Choose Different File</Button>
          </div>
          <div className="overflow-x-auto max-h-80 border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50"><tr>{Object.keys(rows[0] ?? {}).map((k) => <th key={k} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{k}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.slice(0, 50).map((row, i) => <tr key={i} className="hover:bg-gray-50/50">{Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{String(v)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing}>{importing ? 'Importing...' : `Import ${rows.length} Universities`}</Button>
          </div>
        </div>
      )}
      {stage === 'done' && (
        <div className="space-y-4 text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-emerald-600" /></div>
          <p className="text-lg font-semibold text-gray-900">{importedCount} universities imported successfully</p>
          {errors.length > 0 && <p className="text-sm text-amber-600 mt-1">{errors.length} rows had errors</p>}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto text-left">
              {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStage('upload'); setRows([]); setErrors([]); setImportedCount(0); }}>Upload Another File</Button>
            <Button onClick={onSuccess}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
