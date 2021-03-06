import React, {ChangeEvent, FormEvent, useContext, useEffect, useState} from "react";
import { Map, Marker, TileLayer } from 'react-leaflet';
import {LeafletMouseEvent} from "leaflet";
import { FiPlus } from "react-icons/fi";

import api from "../../services/api";
import happyMapIcon from "../../util/mapIcon";
import '../../styles/pages/create-orphanage.css';
import {useParams} from "react-router-dom";
import AdminSidebar from "../../components/admin/Sidebar";
import {AppContext} from "../../contexts/app";
import history from "../../routes/history";

const tilesUrl = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface ImageType {
    id: number | string
    url: string
}
interface RouteParams {
    id: string;
}

export default function EditOrphanage() {
    const {toast} = useContext(AppContext)
    const params = useParams<RouteParams>()
    const [position, setPosition] = useState({latitude: 0, longitude: 0})
    const [name, setName] = useState('')
    const [about, setAbout] = useState('')
    const [instructions, setInstructions] = useState('')
    const [opening_hours, setOpeningHours] = useState('')
    const [open_on_weekends, setOpenOnWeekends] = useState(true)
    const [images, setImages] = useState<File[]>([])
    const [previewImages, setPreviewImages] = useState<ImageType[]>([])

    useEffect(() => {
        api.get(`orphanages/${params.id}`).then(resposne => {
            const {orphanage} = resposne.data
            setPosition({latitude: orphanage.latitude, longitude: orphanage.longitude})
            setName(orphanage.name)
            setAbout(orphanage.about)
            setInstructions(orphanage.instructions)
            setOpeningHours(orphanage.opening_hours)
            setOpenOnWeekends(orphanage.open_on_weekends)
            setPreviewImages([...previewImages, ...orphanage.images])
        })
    }, [params.id])

    function handleMapClick(event: LeafletMouseEvent) {
        const {lat: latitude, lng: longitude} = event.latlng
        setPosition({latitude, longitude})
    }

    function handleSelectImages(event: ChangeEvent<HTMLInputElement>) {
        if (!event.target.files) {
            return
        }

        let selectedImages = Array.from(event.target.files);
        setImages(selectedImages)

        const selectedImagesPreview: ImageType[] = selectedImages.map(image => {
            return {
                id: URL.createObjectURL(image),
                url: URL.createObjectURL(image)
            }
        })

        setPreviewImages([...previewImages, ...selectedImagesPreview])
    }

    async function handleImageRemove(image: ImageType) {
        let index = previewImages.findIndex(img => img.id === image.id)

        if (typeof image.id === 'number') {
            await api.delete(`/admin/images/${image.id}`)
        }

        previewImages.splice(index, 1)

        setPreviewImages([...previewImages])
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const data = new FormData()
        data.append('latitude', String(position.latitude))
        data.append('longitude', String(position.longitude))
        data.append('name', name)
        data.append('about', about)
        data.append('instructions', instructions)
        data.append('opening_hours', opening_hours)
        data.append('open_on_weekends', String(open_on_weekends))
        images.forEach(image => data.append('images', image))

        await api.put(`/admin/orphanages/${params.id}`, data).then(response => {
            toast({
                title: 'Sucesso',
                message: `Orfanato ${name} foi atualizado!`
            })
            history.push('/admin/orphanages')
        })
    }

    if (position.latitude === 0) {
        return null
    }

    return (
        <div id="page-create-orphanage">
            <AdminSidebar page="orphanages" hasPending={false} />
            <main>
                <form className="create-orphanage-form" onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Editando orfanato {name}</legend>

                        <Map
                            center={[position.latitude,position.longitude]}
                            style={{ width: '100%', height: 280 }}
                            zoom={14}
                            onClick={handleMapClick}
                        >
                            <TileLayer
                                url={tilesUrl}
                            />
                            {position.latitude !== 0 && (
                                <Marker
                                    interactive={false}
                                    icon={happyMapIcon}
                                    position={[position.latitude,position.longitude]}
                                />
                            )}
                        </Map>

                        <div className="input-block">
                            <label htmlFor="name">Nome</label>
                            <input id="name" value={name} onChange={event => setName(event.target.value)} />
                        </div>

                        <div className="input-block">
                            <label htmlFor="about">Sobre <span>Máximo de 300 caracteres</span></label>
                            <textarea id="about" maxLength={300} value={about} onChange={event => setAbout(event.target.value)} />
                        </div>

                        <div className="input-block">
                            <label htmlFor="images">Fotos</label>

                            <div className="images-container">
                                {previewImages.map(image => (
                                    <div key={image.id} className="image-wrapper">
                                        <button type="button" className="image-remove" onClick={() => handleImageRemove(image)}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 6L6 18" stroke="#FF669D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6 6L18 18" stroke="#FF669D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                        <img src={image.url} alt={name || 'image'}/>
                                    </div>
                                ))}

                                <label htmlFor="image[]" className="new-image">
                                    <FiPlus size={24} color="#15b6d6" />
                                </label>

                                <input type="file" multiple onChange={handleSelectImages} id="image[]"/>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Visitação</legend>

                        <div className="input-block">
                            <label htmlFor="instructions">Instruções</label>
                            <textarea id="instructions" value={instructions} onChange={event => setInstructions(event.target.value)} />
                        </div>

                        <div className="input-block">
                            <label htmlFor="opening_hours">Horário de funcionamento</label>
                            <input id="opening_hours" value={opening_hours} onChange={event => setOpeningHours(event.target.value)} />
                        </div>

                        <div className="input-block">
                            <label htmlFor="open_on_weekends">Atende fim de semana</label>

                            <div className="button-select">
                                <button type="button" onClick={() => setOpenOnWeekends(true)} className={open_on_weekends ? 'active' : ''}>Sim</button>
                                <button type="button" onClick={() => setOpenOnWeekends(false)} className={!open_on_weekends ? 'active' : ''}>Não</button>
                            </div>
                        </div>
                    </fieldset>

                    <button className="confirm-button" type="submit">
                        Atualizar
                    </button>
                </form>
            </main>
        </div>
    );
}
