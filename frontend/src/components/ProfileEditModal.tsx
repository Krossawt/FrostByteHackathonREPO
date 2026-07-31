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
    const [barangay, setBarangay] = useState(initial.barangay)
    const [photoPreview, setPhotoPreview] = useState(initial.photoURL)
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    // THIS is what controls the Save Changes button + instruction message
    const isDirty = name !== initial.name || barangay !== initial.barangay || photoPreview !== initial.photoURL

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError('')

        try {
            console.log('📸 Starting image upload...', { fileName: file.name, size: file.size })

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024
            if (file.size > maxSize) {
                throw new Error('Image size must be less than 5MB')
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file')
            }

            const supabase = getSupabaseClient()

            // If Supabase credentials are missing, use local FileReader Data URL fallback
            if (!supabase) {
                console.log('ℹ️ Supabase not configured. Using local Data URL avatar preview.')
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

            // Generate unique filename
            const userId = user.id || 'unknown'
            const timestamp = Date.now()
            const fileName = `${userId}_${timestamp}_${file.name}`

            console.log('📤 Uploading to Supabase...', { fileName })

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                console.error('❌ Upload error:', uploadError)
                throw new Error(uploadError.message || 'Upload failed')
            }

            console.log('✅ Upload successful:', data)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName)

            console.log('🖼️ Public URL:', publicUrl)

            // Show preview immediately
            setPhotoPreview(publicUrl)
            console.log('✨ Photo preview updated')
        } catch (err: any) {
            console.error('❌ Photo upload error:', err)
            // Fallback to FileReader if Supabase storage upload fails
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
            setError('Name cannot be empty.')
            return
        }
        if (!barangay) {
            setError('Please select a barangay.')
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

    // THIS is what decides: pop "Discard Changes" only if the form was edited
    const requestClose = () => {
        if (isDirty) {
            setConfirmDiscard(true)
        } else {
            onClose() // no changes made — close freely, no popup
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
                <div className="modal" style={{ width: 'min(480px, 100%)' }}>
                    <div className="modal-header">
                        <span className="modal-title">Edit Your Profile</span>
                        <button className="modal-close" onClick={requestClose} aria-label="Close">✕</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && <div className="alert-error">{error}</div>}

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Profile"
                                        style={{
                                            width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                                            border: '3px solid #fff', boxShadow: '0 6px 20px rgba(118,0,49,0.18)',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 96, height: 96, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--maroon), var(--maroon-mid))',
                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem',
                                    }}>
                                        {name.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                )}
                                <label
                                    htmlFor="profile-photo-input"
                                    className="btn btn-secondary btn-sm"
                                    style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                                >
                                    {uploading ? 'Uploading...' : 'Change Photo'}
                                </label>
                                <input
                                    id="profile-photo-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    disabled={uploading}
                                    style={{ display: 'none' }}
                                />
                                {uploading && (
                                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                        Uploading...
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Barangay</label>
                                <select
                                    className="form-input"
                                    value={barangay}
                                    onChange={e => setBarangay(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select barangay</option>
                                    {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                {/* Instruction message — only shows when NOT dirty */}
                                {!isDirty && (
                                    <span style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--maroon)',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 600,
                                        marginRight: 'auto',
                                        lineHeight: 1,
                                    }}>
                                        Edit a field to enable saving
                                    </span>
                                )}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={requestClose} disabled={saving || uploading}>
                                    Cancel
                                </button>
                                {/* Save Changes button — only shows when dirty */}
                                {isDirty && (
                                    <button type="submit" className="btn btn-save btn-sm" disabled={saving || uploading}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                                {deleteError && <div className="alert-error" style={{ marginBottom: '0.5rem' }}>{deleteError}</div>}
                                {!confirmingDelete ? (
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        style={{ width: '100%' }}
                                        onClick={() => setConfirmingDelete(true)}
                                        disabled={saving || uploading}
                                    >
                                        Delete Account
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#760031' }}>
                                            This will permanently delete your account. Are you sure?
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                style={{ flex: 1 }}
                                                onClick={() => setConfirmingDelete(false)}
                                                disabled={deleting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                style={{ flex: 1 }}
                                                onClick={handleDeleteAccount}
                                                disabled={deleting}
                                            >
                                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Discard Changes confirm — only opens when isDirty was true at requestClose() */}
            <ConfirmDialog
                isOpen={confirmDiscard}
                title="Discard Changes"
                message="Any unsaved changes will be lost. Are you sure you want to close this form?"
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
