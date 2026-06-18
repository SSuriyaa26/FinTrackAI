import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Image as ImageIcon, Loader2, FileWarning, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import ConfirmImportTable from '../components/ConfirmImportTable';

const ImportScreenshot = () => {
  const { settings, bulkAddTransactions, saveRule, showToast } = useFinance();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);

  // Converts File to Base64 String for Gemini API
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const analyzeImageWithGemini = async (base64Image, mimeType) => {
    const apiKey = settings.geminiApiKey;
    
    // Mock parsing if no API key is provided (demo fallback mode)
    if (!apiKey) {
      showToast("No API Key found. Using mock receipt parser for demo.", "info");
      return new Promise(resolve => setTimeout(() => {
        resolve([
          { date: new Date().toISOString().split('T')[0], description: "Zomato - SS Hyderabad Biryani", category: "Food", amount: "420.00", saveRule: true },
          { date: new Date().toISOString().split('T')[0], description: "Uber Ride", category: "Transport", amount: "185.50", saveRule: false }
        ]);
      }, 1500));
    }
    const todayDate = new Date().toISOString().split('T')[0];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
      You are a strict, precision-focused receipt data extractor. Today's real date is ${todayDate}.
      Extract transaction line items from this image and return them STRICTLY as a JSON array of objects.
      CRITICAL RULES:
      1. NEVER hallucinate, guess, or invent transactions. If the image is blurry, empty, or not a receipt, return an empty array [].
      2. Pay close attention to visual cues: if a number is green, has a plus sign (+), or says "received", it is INCOME. If it is red, has a minus sign (-), or says "paid"/"sent", it is an EXPENSE.
      Each object must have exactly these keys:
      - "date" (string in YYYY-MM-DD format, use ${todayDate} only if a partial date like "18th Mar" is given. Do not invent a date.)
      - "description" (string, the merchant or item name exactly as written)
      - "amount" (number, positive value like 120.50. Never negate it.)
      - "category" (string, choose best match from: Food, Transport, Shopping, Housing, Utilities, Entertainment, Health, Income, Other. MUST be "Income" if it was money received/green/positive).
      Only return the raw JSON array, without markdown formatting or other text.
    `;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let text = data.candidates[0]?.content?.parts[0]?.text || "[]";
    
    // Clean up potential markdown formatting from Gemini
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const items = JSON.parse(text);
    return items.map(i => ({ ...i, saveRule: false, amount: parseFloat(i.amount) }));
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    setSelectedImage(URL.createObjectURL(file));
    setLoading(true);
    setParsedItems([]);

    try {
      const base64 = await fileToBase64(file);
      const items = await analyzeImageWithGemini(base64, file.type);
      setParsedItems(items);
      showToast("Receipt parsed successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to parse image. Ensure API key is valid.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (parsedItems.length === 0) return;
    
    setLoading(true);
    try {
      // 1. Save Merchant Rules
      const rulesToSave = parsedItems.filter(item => item.saveRule);
      for (const rule of rulesToSave) {
        // Extract first word roughly as merchant name, or use full desc
        const merchantWord = rule.description.split(' ')[0].toLowerCase(); 
        await saveRule(merchantWord, rule.category);
      }

      // 2. Format transactions for backend
      const txToImport = parsedItems.map(item => ({
        amount: item.category === 'Income' ? Math.abs(parseFloat(item.amount)) : -Math.abs(parseFloat(item.amount)),
        description: item.description,
        category: item.category,
        date: item.date,
        source: 'screenshot'
      }));

      // 3. Bulk import
      await bulkAddTransactions(txToImport);
      navigate('/');
    } catch (error) {
      showToast("Failed to import transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const onDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };

  return (
    <motion.div 
      className="max-w-4xl mx-auto mt-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="glass-card p-6 md:p-8">
        
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" /> Screenshot Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Upload a receipt or payment screenshot. Artificial Intelligence will extract the details magically.</p>
        </div>

        {/* Upload Zone */}
        {!selectedImage ? (
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[300px]
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          >
            <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="text-lg font-semibold text-foreground mb-1">Click to upload or drag & drop</h3>
            <p className="text-sm text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="rounded-xl overflow-hidden border border-border shadow-sm max-h-[300px]">
                <img src={selectedImage} alt="Uploaded Receipt" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => { setSelectedImage(null); setParsedItems([]); }}
                className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
              >
                Upload a different image
              </button>
            </div>
            
            <div className="w-full md:w-2/3">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/30 rounded-xl border border-dashed">
                  <div className="relative mb-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium">Gemini is analyzing the image...</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-2">Extracting merchants, amounts, and dates.</p>
                </div>
              ) : (
                <ConfirmImportTable parsedItems={parsedItems} setParsedItems={setParsedItems} onConfirm={handleConfirm} />
              )}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default ImportScreenshot;
