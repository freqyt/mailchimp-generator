import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Copy, Eye, Code, LogOut, Cloud, Upload, Image as ImageIcon, Smartphone, Monitor, Mail, Package, Share2 } from 'lucide-react';
import type { EmailData, Product, SocialLink, UploadedImage } from './types';
import { generateMailchimpHtml } from './generateMailchimpHtml';
import Login from './Login';

const DEFAULT_SOCIALS: SocialLink[] = [
  { id: '1', name: 'Instagram', url: 'https://instagram.com/freqyt', enabled: true },
  { id: '2', name: 'Sounds List', url: 'https://list.freq.yt/', enabled: true },
  { id: '3', name: 'Booking', url: 'https://booking.freq.yt/', enabled: true },
  { id: '4', name: 'YouTube', url: 'https://youtube.com/@freqyt', enabled: false },
];

const DEFAULT_DATA: EmailData = {
  subjectLine: 'FLASH SALE (24 hours only) ⏰',
  preheader: 'Pick any 2 plugins from the vault for only $50. Limited time drop.',
  title: 'FLASH SALE ⏰',
  intro: '',
  headerImageUrl: 'https://mailchimp-generator.vercel.app/logo.png',
  headerImageSize: 64,
  products: [
    {
      id: '1',
      name: 'Any 2 Plugins. Your Choice.',
      description: 'Build your custom bundle from the vault before the timer runs out.',
      useIcon: true,
      iconName: 'gem',
      iconColor: '#0078D4',
      imageUrl: '',
      originalPrice: '$100',
      price: 'Only $50',
      link: 'https://list.freq.yt/'
    }
  ],
  footerText: '© 2026 FREQ. All rights reserved. You are receiving this email because you opted in via our website.',
  hideIconCircle: true,
  socialLinks: DEFAULT_SOCIALS,
};

interface SavedTemplate {
  name: string;
  data: EmailData;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('freq_auth') === 'true' || sessionStorage.getItem('freq_auth') === 'true';
  });

  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'campaign' | 'products' | 'footer'>('campaign');

  const [data, setData] = useState<EmailData>(() => {
    const saved = localStorage.getItem('freqMailchimpDraft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.socialLinks) parsed.socialLinks = DEFAULT_SOCIALS;
        if (!parsed.subjectLine) parsed.subjectLine = DEFAULT_DATA.subjectLine;
        if (!parsed.preheader) parsed.preheader = DEFAULT_DATA.preheader;
        return parsed;
      } catch (e) {
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });

  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    const saved = localStorage.getItem('freqMailchimpTemplates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Check cloud templates on mount
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(result => {
        if (result.cloudEnabled) {
          setIsCloudSynced(true);
          if (Array.isArray(result.templates) && result.templates.length > 0) {
            setSavedTemplates(result.templates);
          }
        }
      })
      .catch(() => {
        // running locally or without backend
      });
  }, []);

  const [savedImages, setSavedImages] = useState<UploadedImage[]>(() => {
    const saved = localStorage.getItem('freq_saved_images');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: '1', name: 'FREQ Logo (PNG)', url: 'https://mailchimp-generator.vercel.app/logo.png', date: 'Default' }
    ];
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'header' | number>('header');
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  useEffect(() => {
    localStorage.setItem('freq_saved_images', JSON.stringify(savedImages));
  }, [savedImages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64: base64String,
            contentType: file.type,
          }),
        });

        const resData = await response.json();
        const uploadedUrl = resData.url || (reader.result as string);

        const newImage: UploadedImage = {
          id: Date.now().toString(),
          name: file.name,
          url: uploadedUrl,
          date: new Date().toLocaleDateString(),
        };

        setSavedImages(prev => [newImage, ...prev]);

        if (uploadTarget === 'header') {
          updateField('headerImageUrl', uploadedUrl);
        } else if (typeof uploadTarget === 'number') {
          updateProduct(uploadTarget, 'imageUrl', uploadedUrl);
        }
      } catch (err) {
        const localUrl = reader.result as string;
        const newImage: UploadedImage = {
          id: Date.now().toString(),
          name: file.name,
          url: localUrl,
          date: new Date().toLocaleDateString(),
        };
        setSavedImages(prev => [newImage, ...prev]);

        if (uploadTarget === 'header') {
          updateField('headerImageUrl', localUrl);
        } else if (typeof uploadTarget === 'number') {
          updateProduct(uploadTarget, 'imageUrl', localUrl);
        }
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const triggerUpload = (target: 'header' | number) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const selectLibraryImage = (url: string) => {
    if (uploadTarget === 'header') {
      updateField('headerImageUrl', url);
    } else if (typeof uploadTarget === 'number') {
      updateProduct(uploadTarget, 'imageUrl', url);
    }
    setShowImageLibrary(false);
  };
  
  useEffect(() => {
    localStorage.setItem('freqMailchimpDraft', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('freqMailchimpTemplates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const syncTemplatesToCloud = async (templatesToSync: SavedTemplate[]) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templatesToSync),
      });
      const data = await res.json();
      if (data.cloudEnabled) setIsCloudSynced(true);
    } catch (e) {
      console.warn('Cloud sync skipped:', e);
    }
  };

  const handleLogin = (remember: boolean) => {
    if (remember) {
      localStorage.setItem('freq_auth', 'true');
    } else {
      sessionStorage.setItem('freq_auth', 'true');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('freq_auth');
    sessionStorage.removeItem('freq_auth');
    setIsAuthenticated(false);
  };

  const saveCurrentAsTemplate = () => {
    const name = window.prompt('Enter a name for this template:');
    if (!name) return;
    
    setSavedTemplates(prev => {
      const filtered = prev.filter(t => t.name !== name);
      const updated = [...filtered, { name, data }];
      syncTemplatesToCloud(updated);
      return updated;
    });
  };

  const loadTemplate = (templateData: EmailData) => {
    if (window.confirm('This will overwrite your current draft. Continue?')) {
      setData(templateData);
    }
  };

  const deleteTemplate = (name: string) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      setSavedTemplates(prev => {
        const updated = prev.filter(t => t.name !== name);
        syncTemplatesToCloud(updated);
        return updated;
      });
    }
  };

  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const html = generateMailchimpHtml(data, false);
  const previewHtml = generateMailchimpHtml(data, true);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (field: keyof EmailData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const newProducts = [...data.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setData(prev => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: Date.now().toString(),
          name: '',
          description: '',
          useIcon: true,
          iconName: 'none',
          imageUrl: '',
          price: '',
          link: ''
        }
      ]
    }));
  };

  const removeProduct = (index: number) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const list = [...(data.socialLinks || DEFAULT_SOCIALS)];
    list[index] = { ...list[index], [field]: value };
    setData(prev => ({ ...prev, socialLinks: list }));
  };

  const addSocialLink = () => {
    const list = [...(data.socialLinks || DEFAULT_SOCIALS)];
    list.push({
      id: Date.now().toString(),
      name: 'Website',
      url: 'https://',
      enabled: true,
    });
    setData(prev => ({ ...prev, socialLinks: list }));
  };

  const removeSocialLink = (index: number) => {
    const list = (data.socialLinks || DEFAULT_SOCIALS).filter((_, i) => i !== index);
    setData(prev => ({ ...prev, socialLinks: list }));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-freqDarker text-white">
      {/* LEFT SIDE - FORM */}
      <div className="w-1/2 h-full overflow-y-auto border-r border-freqGray p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold mb-1">FREQ Newsletter Generator</h1>
                {isCloudSynced && (
                  <span className="flex items-center text-[11px] bg-green-950/60 text-green-400 border border-green-800/60 rounded-full px-2 py-0.5 mb-1" title="Templates are synced across all your devices in real-time">
                    <Cloud size={11} className="mr-1" /> Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">Create Mailchimp-compatible HTML templates for new plugin drops.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={saveCurrentAsTemplate}
                className="bg-freqGray border border-gray-700 hover:border-freqBlue text-sm px-3 py-1.5 rounded-md transition-colors"
              >
                Save as Template
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#151515] hover:bg-[#202020] border border-gray-800 text-gray-400 hover:text-white p-2 rounded-md transition-colors"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {savedTemplates.length > 0 && (
            <div className="space-y-3 bg-[#111] p-4 rounded-lg border border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300">Saved Templates</h2>
              <div className="flex flex-wrap gap-2">
                {savedTemplates.map(template => (
                  <div key={template.name} className="flex items-center space-x-1 bg-freqDarker border border-gray-700 rounded px-2 py-1">
                    <button 
                      onClick={() => loadTemplate(template.data)}
                      className="text-sm text-freqBlue hover:text-blue-400 transition-colors"
                    >
                      {template.name}
                    </button>
                    <button 
                      onClick={() => deleteTemplate(template.name)}
                      className="text-gray-500 hover:text-red-500 ml-2"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEGMENTED TAB NAVIGATION */}
          <div className="flex bg-[#111] p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'campaign'
                  ? 'bg-freqBlue text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Mail size={14} />
              <span>Campaign</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'products'
                  ? 'bg-freqBlue text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Package size={14} />
              <span>Products</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-300'}`}>
                {data.products.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'footer'
                  ? 'bg-freqBlue text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Share2 size={14} />
              <span>Footer & Socials</span>
            </button>
          </div>

          {/* TAB 1: CAMPAIGN (Inbox Simulator & Header/Intro Settings) */}
          {activeTab === 'campaign' && (
            <div className="space-y-6">
              {/* INBOX SIMULATOR & SUBJECT SETTINGS */}
              <div className="space-y-4 bg-[#0d0d0d] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Mail size={16} className="text-freqBlue" />
                    <h2 className="text-base font-semibold text-white">Inbox Simulator</h2>
                  </div>
                  <span className="text-[11px] text-gray-500">Subject & Preheader</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-gray-300 font-medium">Subject Line</label>
                      <span className={`text-[11px] ${(data.subjectLine || '').length > 40 ? 'text-amber-400' : 'text-gray-500'}`}>
                        {(data.subjectLine || '').length} / 40 chars {(data.subjectLine || '').length > 40 && '(may cut off on mobile)'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      name="campaign_subject_line"
                      id="campaign_subject_line"
                      autoComplete="off"
                      data-bwignore="true"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      value={data.subjectLine || ''}
                      onChange={e => updateField('subjectLine', e.target.value)}
                      placeholder="e.g. FLASH SALE (24 hours only) ⏰"
                      className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-gray-300 font-medium">Preview Text (Preheader)</label>
                      <span className="text-[11px] text-gray-500">
                        {(data.preheader || '').length} chars
                      </span>
                    </div>
                    <input 
                      type="text" 
                      name="campaign_preheader_teaser"
                      id="campaign_preheader_teaser"
                      autoComplete="off"
                      data-bwignore="true"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      value={data.preheader || ''}
                      onChange={e => updateField('preheader', e.target.value)}
                      placeholder="e.g. Pick any 2 plugins from the catalog for $50..."
                      className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                    />
                    <p className="text-[11px] text-gray-500">Hidden in the email body, but displays as the preview teaser in Gmail & Apple Mail.</p>
                  </div>

                  {/* LIVE INBOX SIMULATION MOCKUP */}
                  <div className="bg-[#141414] border border-[#222] rounded-lg p-3 space-y-1 mt-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
                      <span className="font-semibold text-gray-300 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-freqBlue mr-1.5"></span>
                        FREQ
                      </span>
                      <span>Just now</span>
                    </div>
                    <div className="text-xs truncate">
                      <span className="font-bold text-white mr-1.5">
                        {data.subjectLine || 'Untitled Email'}
                      </span>
                      <span className="text-gray-400">
                        — {data.preheader || 'No preview text set (email body will leak here)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HEADER & EMAIL INTRO */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b border-freqGray pb-2">Header & Content</h2>
                
                <div className="space-y-2 bg-[#101010] p-3 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-gray-300">Header Image / Logo</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTarget('header');
                          setShowImageLibrary(true);
                        }}
                        className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white bg-[#181818] border border-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        <ImageIcon size={12} />
                        <span>Library ({savedImages.length})</span>
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => triggerUpload('header')}
                        className="flex items-center space-x-1 text-xs bg-freqBlue hover:bg-blue-600 text-white px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        <Upload size={12} />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                    </div>
                  </div>

                  <input 
                    type="text" 
                    value={data.headerImageUrl}
                    onChange={e => updateField('headerImageUrl', e.target.value)}
                    placeholder="https://... or select from library"
                    className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-xs focus:outline-none focus:border-freqBlue font-mono text-gray-300"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">Display Size:</span>
                    <select
                      value={data.headerImageSize || 64}
                      onChange={e => updateField('headerImageSize', Number(e.target.value))}
                      className="bg-freqDarker border border-gray-800 text-xs rounded px-2.5 py-1 text-white focus:outline-none focus:border-freqBlue"
                    >
                      <option value={36}>Tiny (36px)</option>
                      <option value={48}>Small (48px)</option>
                      <option value={64}>Standard (64px - Recommended)</option>
                      <option value={84}>Medium (84px)</option>
                      <option value={110}>Large (110px)</option>
                      <option value={150}>Hero Mark (150px)</option>
                      <option value={500}>Full Width Banner (500px)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Newsletter Title</label>
                  <input 
                    type="text" 
                    value={data.title}
                    onChange={e => updateField('title', e.target.value)}
                    className="w-full bg-freqGray border border-gray-700 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Introduction Text</label>
                  <textarea 
                    rows={3}
                    value={data.intro}
                    onChange={e => updateField('intro', e.target.value)}
                    className="w-full bg-freqGray border border-gray-700 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                  />
                </div>

                <div className="pt-2 space-y-2 border-t border-gray-800">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="transparentCards"
                      checked={!!data.transparentCards}
                      onChange={e => updateField('transparentCards', e.target.checked)}
                      className="rounded border-gray-700 bg-freqGray text-freqBlue focus:ring-freqBlue"
                    />
                    <label htmlFor="transparentCards" className="text-sm text-gray-300">
                      Transparent Product Cards (remove grey background box)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="hideIconCircle"
                      checked={data.hideIconCircle ?? true}
                      onChange={e => updateField('hideIconCircle', e.target.checked)}
                      className="rounded border-gray-700 bg-freqGray text-freqBlue focus:ring-freqBlue"
                    />
                    <label htmlFor="hideIconCircle" className="text-sm text-gray-300">
                      Remove grey circle behind icons (clean floating icon)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-freqGray pb-2">
                <div>
                  <h2 className="text-lg font-semibold">Products ({data.products.length})</h2>
                  <p className="text-xs text-gray-400">Add, configure, and customize items in this campaign.</p>
                </div>
                <button 
                  onClick={addProduct}
                  className="flex items-center space-x-1 text-sm bg-freqBlue hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="space-y-6">
                {data.products.map((product, i) => (
                  <div key={product.id} className="bg-[#111] border border-freqGray rounded-lg p-4 relative">
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button 
                        onClick={() => removeProduct(i)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="mb-4 text-sm font-medium text-gray-400">Product #{i + 1}</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-400">Product Name</label>
                        <input 
                          type="text" 
                          value={product.name}
                          onChange={e => updateProduct(i, 'name', e.target.value)}
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                        />
                      </div>
                      
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-400">Original Price (Strikethrough)</label>
                        <input 
                          type="text" 
                          value={product.originalPrice || ''}
                          onChange={e => updateProduct(i, 'originalPrice', e.target.value)}
                          placeholder="e.g. $100"
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue text-gray-400"
                        />
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-400">Sale Price (Optional)</label>
                        <input 
                          type="text" 
                          value={product.price}
                          onChange={e => updateProduct(i, 'price', e.target.value)}
                          placeholder="e.g. Only $50"
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue text-freqBlue font-bold"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-400">Description</label>
                        <textarea 
                          rows={2}
                          value={product.description}
                          onChange={e => updateProduct(i, 'description', e.target.value)}
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-gray-400">Visual Media</label>
                          <button 
                            onClick={() => updateProduct(i, 'useIcon', !(product.useIcon ?? true))}
                            className="text-xs text-freqBlue hover:text-blue-400"
                          >
                            {(product.useIcon ?? true) ? 'Switch to Image URL' : 'Switch to FontAwesome Icon'}
                          </button>
                        </div>
                        
                        {(product.useIcon ?? true) ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1">
                                <select 
                                  value={product.iconName || 'none'}
                                  onChange={e => updateProduct(i, 'iconName', e.target.value)}
                                  className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                                >
                                  <option value="none">(None)</option>
                                  <option value="gem">Diamond (Gem)</option>
                                  <option value="fire">Flame (Fire)</option>
                                  <option value="plug">Plug</option>
                                  <option value="bolt">Lightning Bolt</option>
                                  <option value="star">Star</option>
                                  <option value="music">Music Note</option>
                                  <option value="compact-disc">CD / Disc</option>
                                  <option value="wave-square">Wave (Synth)</option>
                                  <option value="sliders">Sliders (Mixer)</option>
                                </select>
                              </div>

                              {product.iconName && product.iconName !== 'none' && (
                                <div className="flex items-center space-x-1.5 bg-freqDarker border border-gray-800 rounded-md px-2 py-1.5 shrink-0" title="Choose Icon Color">
                                  <input 
                                    type="color"
                                    value={product.iconColor || '#0078D4'}
                                    onChange={e => updateProduct(i, 'iconColor', e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                                  />
                                  <div className="flex space-x-1 pl-1">
                                    {[
                                      { color: '#0078D4', title: 'FREQ Blue' },
                                      { color: '#ffffff', title: 'White' },
                                      { color: '#ff6b22', title: 'Flame Orange' },
                                      { color: '#f59e0b', title: 'Gold' },
                                      { color: '#ef4444', title: 'Red' }
                                    ].map(({ color, title }) => (
                                      <button
                                        key={color}
                                        type="button"
                                        title={title}
                                        onClick={() => updateProduct(i, 'iconColor', color)}
                                        style={{ backgroundColor: color }}
                                        className={`w-3.5 h-3.5 rounded-full border ${product.iconColor === color ? 'border-white ring-1 ring-white' : 'border-gray-800'} hover:scale-125 transition-transform`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ICON PLACEMENT SWITCHER */}
                            {product.iconName && product.iconName !== 'none' && (
                              <div className="flex items-center justify-between pt-0.5 text-xs text-gray-400">
                                <span>Icon Placement:</span>
                                <div className="flex items-center space-x-1 bg-[#161616] p-0.5 rounded border border-gray-800">
                                  <button
                                    type="button"
                                    onClick={() => updateProduct(i, 'iconPosition', 'inline')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                      (product.iconPosition || 'inline') === 'inline'
                                        ? 'bg-freqBlue text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    Inline with Title
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateProduct(i, 'iconPosition', 'top')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                      product.iconPosition === 'top'
                                        ? 'bg-freqBlue text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                  }`}
                                >
                                  Top (Floating)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        ) : (
                          <div className="flex space-x-2">
                            <input 
                              type="text" 
                              value={product.imageUrl}
                              onChange={e => updateProduct(i, 'imageUrl', e.target.value)}
                              placeholder="https://... or upload image"
                              className="flex-1 bg-freqDarker border border-gray-800 rounded-md p-2 text-xs focus:outline-none focus:border-freqBlue font-mono text-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setUploadTarget(i);
                                setShowImageLibrary(true);
                              }}
                              className="px-2.5 py-1 bg-[#181818] hover:bg-[#222] border border-gray-800 text-gray-300 rounded text-xs flex items-center space-x-1 transition-colors"
                              title="Choose from saved images"
                            >
                              <ImageIcon size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => triggerUpload(i)}
                              className="px-2.5 py-1 bg-freqBlue hover:bg-blue-600 text-white rounded text-xs flex items-center space-x-1 transition-colors disabled:opacity-50"
                              title="Upload new image"
                            >
                              <Upload size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-400">Link URL</label>
                        <input 
                          type="text" 
                          value={product.link}
                          onChange={e => updateProduct(i, 'link', e.target.value)}
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                        />
                      </div>

                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-400">Button Text (Optional)</label>
                        <input 
                          type="text" 
                          value={product.buttonText || ''}
                          onChange={e => updateProduct(i, 'buttonText', e.target.value)}
                          placeholder="Check It Out"
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FOOTER & SOCIALS & TEMPLATES */}
          {activeTab === 'footer' && (
            <div className="space-y-6">
              {/* SOCIAL LINKS */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-freqGray pb-2">
                  <div>
                    <h2 className="text-lg font-semibold">Social & Brand Links</h2>
                    <p className="text-xs text-gray-500">Toggle or customize individual pills displayed above the footer.</p>
                  </div>
                  <button 
                    onClick={addSocialLink}
                    className="flex items-center space-x-1 text-xs bg-[#181818] hover:bg-[#252525] border border-gray-700 text-gray-200 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(data.socialLinks || DEFAULT_SOCIALS).map((social, i) => (
                    <div 
                      key={social.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        social.enabled 
                          ? 'bg-[#101010] border-gray-800' 
                          : 'bg-[#0a0a0a] border-gray-900 opacity-60'
                      }`}
                    >
                      {/* Enable / Disable Toggle */}
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={social.enabled}
                          onChange={e => updateSocialLink(i, 'enabled', e.target.checked)}
                          className="rounded border-gray-700 bg-freqDarker text-freqBlue focus:ring-0 cursor-pointer"
                        />
                      </label>

                      {/* Name */}
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={social.name}
                          onChange={e => updateSocialLink(i, 'name', e.target.value)}
                          placeholder="Label (e.g. Instagram)"
                          className="w-full bg-freqDarker border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-freqBlue"
                        />
                      </div>

                      {/* URL */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={social.url}
                          onChange={e => updateSocialLink(i, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-freqDarker border border-gray-800 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-freqBlue font-mono"
                        />
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeSocialLink(i)}
                        className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                        title="Remove social link"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER SETTINGS */}
              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-semibold border-b border-freqGray pb-2">Footer Settings</h2>
                <div className="space-y-1">
                  <label className="text-sm text-gray-300">Footer Text</label>
                  <textarea 
                    rows={2}
                    value={data.footerText}
                    onChange={e => updateField('footerText', e.target.value)}
                    className="w-full bg-freqGray border border-gray-700 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 pb-4 border-t border-freqGray flex justify-end">
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your draft and start over?')) {
                  setData(DEFAULT_DATA);
                }
              }}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Reset to Default
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE - PREVIEW */}
      <div className="w-1/2 h-full flex flex-col bg-freqDark">
        <div className="h-16 border-b border-freqGray flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1 bg-freqGray p-1 rounded-md">
              <button 
                onClick={() => setViewMode('preview')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'preview' ? 'bg-freqDarker text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button 
                onClick={() => setViewMode('code')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'code' ? 'bg-freqDarker text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <Code size={16} />
                <span>Code</span>
              </button>
            </div>

            {viewMode === 'preview' && (
              <div className="flex space-x-1 bg-[#141414] border border-gray-800 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${deviceView === 'desktop' ? 'bg-[#252525] text-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Desktop View (600px)"
                >
                  <Monitor size={13} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors ${deviceView === 'mobile' ? 'bg-[#252525] text-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Mobile View (375px)"
                >
                  <Smartphone size={13} />
                  <span>Mobile</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleCopy}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-freqBlue hover:bg-blue-600 text-white'
            }`}
          >
            <Copy size={16} />
            <span>{copied ? 'Copied HTML!' : 'Copy to Mailchimp'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-[#030303] flex justify-center">
          {viewMode === 'preview' ? (
            <div 
              className={`h-full overflow-y-auto transition-all duration-300 ${
                deviceView === 'mobile' 
                  ? 'w-[375px] max-w-[375px] border-x border-[#202020] shadow-2xl bg-[#050505]' 
                  : 'w-full bg-[#050505]'
              }`}
              style={{ backgroundColor: '#050505' }}
              dangerouslySetInnerHTML={{ __html: previewHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || previewHtml }}
            />
          ) : (
            <div className="w-full h-full overflow-y-auto bg-freqDarker p-6 text-sm text-gray-300 font-mono">
              <pre className="whitespace-pre-wrap">{html}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Image Library Modal */}
      {showImageLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-[#222] rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
              <div>
                <h3 className="font-semibold text-white text-base">Image & Media Library</h3>
                <p className="text-xs text-gray-500">Click any image to apply it to your {uploadTarget === 'header' ? 'Header Logo' : `Product #${Number(uploadTarget) + 1}`}</p>
              </div>
              <button 
                onClick={() => setShowImageLibrary(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {savedImages.map(img => (
                <div 
                  key={img.id}
                  onClick={() => selectLibraryImage(img.url)}
                  className="group relative bg-[#141414] border border-gray-800 hover:border-freqBlue rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-2 overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 truncate w-full text-center group-hover:text-white">
                    {img.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-gray-800 flex justify-between items-center">
              <span className="text-xs text-gray-500">{savedImages.length} saved images</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => triggerUpload(uploadTarget)}
                  className="px-3 py-1.5 bg-freqBlue hover:bg-blue-600 text-white text-xs rounded-md transition-colors flex items-center space-x-1"
                >
                  <Upload size={12} />
                  <span>Upload New</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageLibrary(false)}
                  className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#252525] text-gray-300 text-xs rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
