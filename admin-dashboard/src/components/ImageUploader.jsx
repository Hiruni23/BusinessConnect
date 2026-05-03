import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ImageUploader({ setGallery, existingImages = [] }) {
  const [images, setImages] = useState(existingImages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      alert("Maximum 5 images allowed for premium listings.");
      return;
    }

    setLoading(true);
    const uploadedUrls = [];

    try {
      for (let file of acceptedFiles) {
        if (!file.type.startsWith("image/")) {
          alert(`File ${file.name} is not an image.`);
          continue;
        }

        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      setGallery(updatedImages);
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Upload failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [images, setGallery]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    setGallery(updated);
  };

  return (
    <div className="multi-uploader-container">
      <div 
        {...getRootProps()} 
        className={`dropzone-area ${isDragActive ? 'active' : ''} ${loading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <span className="dropzone-icon">{loading ? '⏳' : '📸'}</span>
          <p>{loading ? 'Uploading files...' : 'Drag & drop images here, or click to browse'}</p>
          <span className="dropzone-hint">PNG, JPG or WebP (Max 5 files)</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((img, index) => (
            <div key={index} className="preview-card">
              <img src={img} alt={`Preview ${index}`} className="preview-img" />
              <button 
                type="button" 
                className="preview-remove-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                ✕
              </button>
              {index === 0 && <span className="main-label">Cover</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
