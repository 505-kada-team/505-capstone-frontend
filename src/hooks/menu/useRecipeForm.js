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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const calculateTotalCost = useCallback(
    (inventories) => {
      const currentIngredients = form.watch("ingredients");
      return currentIngredients.reduce((total, item) => {
        const inv = inventories.find((i) => i._id === item.inventoryId);
        const qty = Number(item.quantityNeeded) || 0;
        return inv && inv.lastCostBatch
          ? total + inv.lastCostBatch * qty
          : total;
      }, 0);
    },
    [form],
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleFile = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    form.setValue("image", "https://cdn.example.com/mock-upload/" + file.name, {
      shouldValidate: true,
    });
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
    form.setValue("image", "", { shouldValidate: true });
  };

  const reset = useCallback(() => {
    form.reset(EMPTY_VALUES);
    setPreviewImage(null);
  }, [form]);

  return {
    form,
    fields,
    append,
    remove,
    previewImage,
    dragActive,
    calculateTotalCost,
    handleDrag,
    handleDrop,
    handleChangeFile,
    clearImage,
    reset,
  };
}
