
'use client';

import AnimateOnScroll from '@/components/AnimateOnScroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Loader2, ShieldCheck, Download, Lock, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function UnlockPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);
    const { toast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setUnlockedUrl(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: MAX_FILE_SIZE_BYTES,
        multiple: false,
    });

    const handleUnlock = async () => {
        if (!file) {
            toast({ variant: 'destructive', title: 'No file selected' });
            return;
        }
        setIsUnlocking(true);
        try {
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes, {
                password: password,
                ignoreEncryption: false,
            });
            const unlockedPdfBytes = await pdfDoc.save();
            const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setUnlockedUrl(url);
            toast({ title: 'PDF Unlocked!', description: 'Your file is ready for download.' });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to unlock PDF',
                description: 'Incorrect password or corrupted file.',
            });
        } finally {
            setIsUnlocking(false);
        }
    };
    
    const reset = () => {
        setFile(null);
        setPassword('');
        setUnlockedUrl(null);
        if (unlockedUrl) {
            URL.revokeObjectURL(unlockedUrl);
        }
    }

    return (
        <div className="flex flex-col flex-1 py-8 sm:py-12">
            <section className="text-center mb-12">
                <AnimateOnScroll animation="animate-in fade-in-0 slide-in-from-bottom-12" className="duration-500">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
                        Unlock PDF
                        <br />
                        <span className="relative inline-block">
                            <span className="relative bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Remove Restrictions</span>
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
                        Remove password protection from your PDF files securely in your browser.
                    </p>
                </AnimateOnScroll>
            </section>

            <main className="flex-1 w-full">
                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Unlock Your PDF</CardTitle>
                            <CardDescription>Upload your file and enter the password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!unlockedUrl ? (
                                <>
                                    {!file ? (
                                         <div {...getRootProps()} className={cn("flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed", isDragActive && "border-primary")}>
                                            <input {...getInputProps()} />
                                            <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                            <p className="mt-2 font-semibold">Drop PDF here or click to upload</p>
                                            <p className="text-sm text-muted-foreground">Max file size: {MAX_FILE_SIZE_MB}MB</p>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg border bg-card/50 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Lock className="w-8 h-8 text-yellow-500 shrink-0" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setFile(null)}><X className="w-4 h-4" /></Button>
                                        </div>
                                    )}

                                    {file && (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="password">PDF Password</Label>
                                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
                                            </div>
                                            <Button onClick={handleUnlock} disabled={isUnlocking || !password} className="w-full">
                                                {isUnlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                                Unlock PDF
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center space-y-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                     <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                                    <h3 className="text-xl font-bold">PDF Unlocked!</h3>
                                    <a href={unlockedUrl} download={file?.name.replace(/\.pdf$/i, '_unlocked.pdf')}>
                                        <Button className="w-full bg-green-600 hover:bg-green-700">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Unlocked PDF
                                        </Button>
                                    </a>
                                     <Button variant="outline" className="w-full" onClick={reset}>Unlock Another File</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
