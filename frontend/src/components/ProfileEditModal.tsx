/// <reference types="vite/client" />
import { useState, FormEvent } from 'react'
import Portal from './Portal'
import ConfirmDialog from './ConfirmDialog'
import type { UserAccount } from '../types'
import { BARANGAYS } from '../constants'
import { createClient } from '@supabase/supabase-js'

interface ProfileEditModalProps {
    user: UserAccount
    onClose: () => void
    onDiscard: () => void
    onSave: (updates: { name: string; barangay: string; photoURL: string }) => Promise<void>
    onDeleteAccount: () => Promise<void>
}

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('ℹ️ Note: Supabase storage unconfigured. Local FileReader avatar preview active.')
}
const getSupabaseClient = () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null
    try {
        return createClient(SUPABASE_URL, SUPABASE_KEY)
    } catch (err) {
        console.warn('Supabase initialization warning:', err)
        return null
    }
}

export default function ProfileEditModal({ user, onClose, onDiscard, onSave, onDeleteAccount }: ProfileEditModalProps) {
    const initial = {
        name: user.name || '',
        barangay: user.barangay || '',
        photoURL: user.photoURL || '',
    }

    const [name, setName] = useState(initial.name)
    const barangay = initial.barangay
    const [photoPreview, setPhotoPreview] = useState(initial.photoURL)
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    // Save enabled ONLY when name or photoPreview changes from initial
    const isDirty = name.trim() !== initial.name || photoPreview !== initial.photoURL

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError('')

        try {
            const maxSize = 5 * 1024 * 1024
            if (file.size > maxSize) {
                throw new Error('Image size must be less than 5MB')
            }
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file')
            }

            const supabase = getSupabaseClient()

            if (!supabase) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setPhotoPreview(String(event.target.result))
                    }
                    setUploading(false)
                }
                reader.readAsDataURL(file)
                return
            }

            const userId = user.id || 'unknown'
            const timestamp = Date.now()
            const fileName = `${userId}_${timestamp}_${file.name}`

            const { data, error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                throw new Error(uploadError.message || 'Upload failed')
            }

            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName)

            setPhotoPreview(publicUrl)
        } catch (err: any) {
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setPhotoPreview(String(event.target.result))
                }
            }
            reader.readAsDataURL(file)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        if (!name.trim()) {
            setError('Full Name cannot be empty.')
            return
        }
        setSaving(true)
        try {
            await onSave({ name: name.trim(), barangay, photoURL: photoPreview })
            onClose()
        } catch (err: any) {
            setError(err?.message || 'Failed to update profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const requestClose = () => {
        if (isDirty) {
            setConfirmDiscard(true)
        } else {
            onClose()
        }
    }

    const handleDeleteAccount = async () => {
        setDeleteError('')
        setDeleting(true)
        try {
            await onDeleteAccount()
        } catch (err: any) {
            setDeleteError(err?.message || 'Failed to delete account. Please try again.')
            setDeleting(false)
        }
    }

    return (
        <Portal>
            <div
                className="modal-overlay"
                onClick={e => { if (e.target === e.currentTarget) requestClose() }}
            >
                <div className="modal" style={{ width: 'min(520px, 95vw)', padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                    
                    {/* Top Decorative Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, #760031 0%, #4a001f 60%, #1a000b 100%)',
                        padding: '1.75rem 1.5rem 2.75rem',
                        position: 'relative',
                        color: '#fff',
                        textAlign: 'center'
                    }}>
                        <button
                            className="modal-close"
                            onClick={requestClose}
                            aria-label="Close"
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'rgba(255,255,255,0.15)', color: '#fff',
                                border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            ✕
                        </button>
                        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FEEC41', fontWeight: 800, marginBottom: '0.2rem' }}>
                            CITIZEN ACCOUNT MANAGEMENT
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', margin: 0, color: '#fff' }}>
                            My Profile Settings
                        </h2>
                    </div>

                    {/* Avatar Header overlap */}
                    <div style={{ marginTop: '-42px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1.5rem 1.5rem' }}>
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Profile"
                                    style={{
                                        width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                                        border: '4px solid #fff', boxShadow: '0 10px 24px rgba(118,0,49,0.25)',
                                        background: '#fff'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 88, height: 88, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--maroon), #4a001f)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.2rem',
                                    border: '4px solid #fff', boxShadow: '0 10px 24px rgba(118,0,49,0.25)',
                                }}>
                                    {name.charAt(0).toUpperCase() || 'C'}
                                </div>
                            )}

                            <label
                                htmlFor="profile-photo-input"
                                style={{
                                    position: 'absolute', bottom: '2px', right: '2px',
                                    background: '#760031', color: '#fff', border: '2px solid #fff',
                                    borderRadius: '50%', width: '30px', height: '30px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    fontSize: '0.85rem'
                                }}
                                title="Change Profile Picture"
                            >
                                📷
                            </label>
                            <input
                                id="profile-photo-input"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, background: 'rgba(22, 101, 52, 0.12)', color: '#166534', padding: '0.25rem 0.65rem', borderRadius: '9999px', border: '1px solid rgba(22, 101, 52, 0.2)' }}>
                                🛡️ Verified Citizen Account
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, background: 'rgba(118, 0, 49, 0.08)', color: 'var(--maroon)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
                                📍 Barangay {barangay || 'Santa Rosa'}
                            </span>
                        </div>
                        {uploading && <span style={{ fontSize: '0.75rem', color: 'var(--maroon)', fontWeight: 600 }}>Uploading profile photo...</span>}
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem' }}>
                        {error && <div className="alert-error" style={{ marginBottom: '1rem', borderRadius: '12px' }}>{error}</div>}

                        <div style={{ background: '#fdfafd', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(118, 0, 49, 0.1)', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label" style={{ fontWeight: 800, color: 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    ✏️ Full Name (Editable)
                                </label>
                                <input
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    style={{ fontWeight: 600, fontSize: '0.95rem', background: '#fff', border: '1.5px solid rgba(118,0,49,0.2)', padding: '0.65rem 0.85rem' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontWeight: 800, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    🔒 Registered Barangay (Fixed)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        value={barangay || 'Santa Rosa City Resident'}
                                        disabled
                                        readOnly
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.04)',
                                            color: '#555',
                                            fontWeight: 700,
                                            cursor: 'not-allowed',
                                            border: '1px solid rgba(0,0,0,0.12)',
                                            paddingRight: '2.5rem'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }} title="Barangay is locked by residency verification">
                                        🔒
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.35rem', display: 'block', fontStyle: 'italic' }}>
                                    ℹ️ Barangay residence is verified upon registration and cannot be changed online. Contact CYDO Admin for official relocation.
                                </span>
                            </div>
                        </div>

                        {/* Additional Account Metadata Card */}
                        <div style={{ background: '#f8fafc', padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                                Account Information & Compliance
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8rem' }}>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Role Status</span>
                                    <strong style={{ color: '#0f172a' }}>Youth Resident Voter</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Municipality</span>
                                    <strong style={{ color: '#0f172a' }}>Santa Rosa, Laguna</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>RA 10742 Status</span>
                                    <strong style={{ color: '#166534' }}>Active Beneficiary</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Account ID</span>
                                    <strong style={{ color: '#0f172a' }}>#{user.id.slice(0, 8)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                {!isDirty && (
                                    <span style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--maroon)',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        marginRight: 'auto',
                                    }}>
                                        Edit full name or photo to save changes
                                    </span>
                                )}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={requestClose} disabled={saving || uploading} style={{ fontWeight: 700, padding: '0.6rem 1.2rem' }}>
                                    Cancel
                                </button>
                                {isDirty && (
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving || uploading} style={{ fontWeight: 800, padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, var(--maroon), #4a001f)' }}>
                                        {saving ? 'Saving...' : 'Save Profile Changes'}
                                    </button>
                                )}
                            </div>

                            {/* Danger Zone */}
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.85rem' }}>
                                {deleteError && <div className="alert-error" style={{ marginBottom: '0.5rem' }}>{deleteError}</div>}
                                {!confirmingDelete ? (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        style={{ width: '100%', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.04)', fontWeight: 700 }}
                                        onClick={() => setConfirmingDelete(true)}
                                        disabled={saving || uploading}
                                    >
                                        🗑️ Delete Account
                                    </button>
                                ) : (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.85rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        <span style={{ fontSize: '0.82rem', color: '#991b1b', fontWeight: 700 }}>
                                            ⚠️ Permanent Action: Are you sure you want to delete your citizen account?
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                style={{ flex: 1, fontWeight: 700 }}
                                                onClick={() => setConfirmingDelete(false)}
                                                disabled={deleting}
                                            >
                                                Keep Account
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                style={{ flex: 1, fontWeight: 800, background: '#dc2626' }}
                                                onClick={handleDeleteAccount}
                                                disabled={deleting}
                                            >
                                                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Discard Changes confirm */}
            <ConfirmDialog
                isOpen={confirmDiscard}
                title="Discard Profile Changes"
                message="Any unsaved profile edits will be lost. Are you sure you want to close?"
                confirmLabel="Discard"
                cancelLabel="Keep Editing"
                variant="danger"
                onConfirm={() => {
                    setConfirmDiscard(false)
                    onDiscard()
                }}
                onCancel={() => setConfirmDiscard(false)}
            />
        </Portal>
    )
}
