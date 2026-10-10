import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Eye, Code, LogOut, Cloud } from 'lucide-react';
import type { EmailData, Product } from './types';
import { generateMailchimpHtml } from './generateMailchimpHtml';
import Login from './Login';

const DEFAULT_DATA: EmailData = {
  title: 'New Plugins Added to the Vault!',
  intro: 'Check out the latest additions to freq.yt. We have just dropped some fresh plugins and Kontakt libraries that will take your production to the next level.',
  headerImageUrl: 'https://music-store-pi.vercel.app/favicon.svg',
  products: [
    {
      id: '1',
      name: 'Analog Warmth Saturation',
      description: 'Get that classic tape sound directly in your DAW. Perfect for drums, bass, and mastering bus.',
      imageUrl: 'https://images.unsplash.com/photo-1598508905848-4fd156822453?w=500&q=80',
      price: '$29.00',
      link: 'https://list.freq.yt/'
    }
  ],
  footerText: '© 2026 FREQ. All rights reserved. You are receiving this email because you opted in via our website.',
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

  const [data, setData] = useState<EmailData>(() => {
    const saved = localStorage.getItem('freqMailchimpDraft');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const html = generateMailchimpHtml(data);

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

          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-freqGray pb-2">Global Settings</h2>
            
            <div className="space-y-1">
              <label className="text-sm text-gray-300">Header Image URL</label>
              <input 
                type="text" 
                value={data.headerImageUrl}
                onChange={e => updateField('headerImageUrl', e.target.value)}
                className="w-full bg-freqGray border border-gray-700 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
              />
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

            <div className="flex items-center space-x-2 pt-2">
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
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-freqGray pb-2">
              <h2 className="text-lg font-semibold">Products</h2>
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
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs text-gray-400">Product Name</label>
                      <input 
                        type="text" 
                        value={product.name}
                        onChange={e => updateProduct(i, 'name', e.target.value)}
                        className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                      />
                    </div>
                    
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs text-gray-400">Price (Optional)</label>
                      <input 
                        type="text" 
                        value={product.price}
                        onChange={e => updateProduct(i, 'price', e.target.value)}
                        placeholder="e.g. $49.00"
                        className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
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
                          onClick={() => updateProduct(i, 'useIcon', !product.useIcon)}
                          className="text-xs text-freqBlue hover:text-blue-400"
                        >
                          {product.useIcon ? 'Switch to Image URL' : 'Switch to FontAwesome Icon'}
                        </button>
                      </div>
                      
                      {product.useIcon ? (
                        <div className="flex space-x-2">
                          <select 
                            value={product.iconName || 'plug'}
                            onChange={e => updateProduct(i, 'iconName', e.target.value)}
                            className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                          >
                            <option value="plug">Plug</option>
                            <option value="fire">Flame (Fire)</option>
                            <option value="gem">Diamond (Gem)</option>
                            <option value="bolt">Lightning Bolt</option>
                            <option value="star">Star</option>
                            <option value="music">Music Note</option>
                            <option value="compact-disc">CD / Disc</option>
                            <option value="wave-square">Wave (Synth)</option>
                            <option value="sliders">Sliders (Mixer)</option>
                          </select>
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={product.imageUrl}
                          onChange={e => updateProduct(i, 'imageUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-freqDarker border border-gray-800 rounded-md p-2 text-sm focus:outline-none focus:border-freqBlue"
                        />
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

        <div className="flex-1 overflow-hidden bg-[#e5e5e5]">
          {viewMode === 'preview' ? (
            <div 
              className="w-full h-full overflow-y-auto"
              style={{ backgroundColor: '#050505' }}
              dangerouslySetInnerHTML={{ __html: html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html }}
            />
          ) : (
            <div className="w-full h-full overflow-y-auto bg-freqDarker p-6 text-sm text-gray-300 font-mono">
              <pre className="whitespace-pre-wrap">{html}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
