'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Wand2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        baseUrl: '',
        description: '',
        tone: 'professional',
        language: 'en-US',
        aiSummary: '',
        aiDetails: ''
    });

    const handleAutoFill = async () => {
        if (!formData.baseUrl) return;

        setScraping(true);
        try {
            const res = await fetch('/api/scrape-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formData.baseUrl }),
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    name: data.title || prev.name,
                    description: data.description || prev.description,
                    aiSummary: data.summary || '',
                    aiDetails: data.details || ''
                }));
            }
        } catch (error) {
            console.error('Auto-fill error:', error);
        } finally {
            setScraping(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const project = await res.json();
                router.push(`/dashboard/${project.id}`);
            } else {
                console.error('Failed to create project');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-5xl"
            >
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="pb-6 px-8 pt-8 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                    <Wand2 className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-2xl font-semibold text-gray-900">Create New Project</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Auto-segments enabled</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 md:p-10">
                        <form onSubmit={onSubmit} className="space-y-6">
                            {/* Row 1: URL + Auto-fill + Name */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4">
                                <div className="md:col-span-5">
                                    <Label htmlFor="baseUrl" className="text-sm text-gray-700 mb-2 block font-medium">Website URL</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="baseUrl"
                                            name="baseUrl"
                                            placeholder="https://example.com"
                                            value={formData.baseUrl}
                                            onChange={handleChange}
                                            className="pl-10 h-11 text-base rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex items-end">
                                    <Button
                                        type="button"
                                        onClick={handleAutoFill}
                                        disabled={scraping || !formData.baseUrl}
                                        size="sm"
                                        className={cn(
                                            "h-11 w-full text-sm rounded-lg font-medium",
                                            scraping ? "bg-gray-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                        )}
                                    >
                                        {scraping ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                <Sparkles className="h-4 w-4" />
                                            </motion.div>
                                        ) : (
                                            <><Sparkles className="h-4 w-4 mr-1.5" />Auto-fill</>
                                        )}
                                    </Button>
                                </div>
                                <div className="md:col-span-5">
                                    <Label htmlFor="name" className="text-sm text-gray-700 mb-2 block font-medium">Project Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="My Awesome Product"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="h-11 text-base rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 2: Description */}
                            <div>
                                <Label htmlFor="description" className="text-sm text-gray-700 mb-2 block font-medium">Product Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe your product or paste your homepage copy..."
                                    className="min-h-[100px] text-base rounded-lg resize-none p-4 leading-relaxed"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Row 3: Tone + Language */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="tone" className="text-sm text-gray-700 mb-2 block font-medium">Brand Tone</Label>
                                    <Select name="tone" value={formData.tone} onValueChange={(val) => handleSelectChange('tone', val)}>
                                        <SelectTrigger className="h-11 text-base rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="casual">Casual</SelectItem>
                                            <SelectItem value="playful">Playful</SelectItem>
                                            <SelectItem value="energetic">Energetic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="language" className="text-sm text-gray-700 mb-2 block font-medium">Language</Label>
                                    <Select name="language" value={formData.language} onValueChange={(val) => handleSelectChange('language', val)}>
                                        <SelectTrigger className="h-11 text-base rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base rounded-lg bg-blue-600 hover:bg-blue-700 font-medium shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Project...</>
                                    ) : (
                                        <>Create Project<ArrowRight className="h-4 w-4 ml-2" /></>
                                    )}
                                </Button>
                            </div>

                            {/* Inline info */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                                        <span>AI analyzes your site</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                                        <span>Creates 3 default segments</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                                        <span>Generates voice agents</span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
