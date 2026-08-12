import { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMenuSchema } from "@/schemas/menuSchema";

const EMPTY_VALUES = {
  name: "",
  description: "",
  image: "",
  sellingPrice: "",
  ingredients: [],
};

export function useRecipeForm(initialValues) {
  const [previewImage, setPreviewImage] = useState(
    initialValues?.image ?? null,
  );
  const [imageFile, setImageFile] = useState(null); // BARU — File asli buat di-upload
  const [dragActive, setDragActive] = useState(false);

  const form = useForm({
    resolver: zodResolver(createMenuSchema),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({ ...EMPTY_VALUES, ...initialValues });
      setPreviewImage(initialValues.image ?? null);
      setImageFile(null); // reset saat buka modal edit menu lain
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB — samakan dengan backend
  const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

  const handleFile = (file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      form.setError("image", {
        message: "Format harus PNG atau JPG",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      form.setError("image", {
        message: `Ukuran gambar maksimal 2MB (file ini ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setImageFile(file);
    form.clearErrors("image");
    form.setValue("image", file.name, { shouldValidate: true });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChangeFile = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const clearImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    form.setValue("image", "", { shouldValidate: true });
  };

  const reset = useCallback(() => {
    form.reset(EMPTY_VALUES);
    setPreviewImage(null);
    setImageFile(null);
  }, [form]);

  return {
    form,
    fields,
    append,
    remove,
    previewImage,
    imageFile, // BARU — diteruskan ke modal
    dragActive,
    handleDrag,
    handleDrop,
    handleChangeFile,
    clearImage,
    reset,
  };
}
