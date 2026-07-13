import { useState } from "react";
import { BookOpen, Trash2 } from "lucide-react";
import { useFormik } from "formik";
import { useToast } from "../../context/ToastContext";
import { menus as menusApi } from "./api";
import type { MenuItem } from "./types";
import type { Ingredient } from "../ingredients/types";
import { formatRupiah, getValidationErrorMap } from "../../utils/helpers";
import { Button } from "../../components/ui/button";
import { Modal, ConfirmModal } from "../../components/ui/dialog";
import { Input, RupiahInput } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { menuSchema } from "./schemas";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "../../components/ui/table";

interface MenusPageProps {
  menus: MenuItem[];
  ingredients: Ingredient[];
  fetchData: () => void;
}

function getSugarInfo(
  menuName: string,
  recipeQty: number,
  ingredientName: string,
  ingredientUnit: string,
  dbLessQty?: number | null,
) {
  const isSugar = ingredientName.toLowerCase().includes("gula");
  if (!isSugar) return null;

  const nameLower = menuName.toLowerCase();
  let lessQty = dbLessQty !== null && dbLessQty !== undefined ? dbLessQty : recipeQty;
  if (dbLessQty === null || dbLessQty === undefined) {
    if (nameLower.includes("kopi susu") || nameLower.includes("kopsus")) {
      lessQty = 10;
    } else if (nameLower.includes("hazelnut") || nameLower.includes("pandan")) {
      lessQty = 5;
    }
  }

  return {
    normal: `${recipeQty} ${ingredientUnit}`,
    less: `${lessQty} ${ingredientUnit}`,
    none: `0 ${ingredientUnit}`,
  };
}

export default function MenusPage({
  menus,
  ingredients,
  fetchData,
}: MenusPageProps) {
  const { toast } = useToast();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<MenuItem | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [editingMenu, setEditingMenu] = useState<{
    id: string;
    name: string;
    defaultSellingPrice: number;
    category: string;
    recipes: {
      ingredientId: string;
      quantity: number;
      lessSugarQuantity?: number | null;
      optional: boolean;
      canExcludeForPersonalUse: boolean;
    }[];
  } | null>(null);

  // Formik 1: Add Menu
  const addFormik = useFormik({
    initialValues: {
      name: "",
      defaultSellingPrice: 0,
      category: "MAIN",
      recipes: [] as {
        ingredientId: string;
        quantity: number;
        lessSugarQuantity?: number | null;
        optional: boolean;
        canExcludeForPersonalUse: boolean;
      }[],
    },
    validate: async (values) => {
      try {
        await menuSchema.validate({
          name: values.name,
          category: values.category,
          basePrice: values.defaultSellingPrice,
          recipe: values.recipes.map(r => ({
            ingredientId: r.ingredientId,
            quantity: r.quantity,
          })),
        }, { abortEarly: false });
      } catch (err: any) {
        return getValidationErrorMap(err);
      }
    },
    onSubmit: async (values) => {
      try {
        await menusApi.create({
          name: values.name,
          defaultSellingPrice: values.defaultSellingPrice,
          category: values.category,
          recipes: values.recipes.filter(
            (r) => r.ingredientId && r.quantity > 0,
          ),
        });
        setShowAddMenu(false);
        addFormik.resetForm();
        toast.success("Menu dan formulir resep berhasil disimpan");
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  // Formik 2: Edit Menu
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingMenu?.name || "",
      defaultSellingPrice: editingMenu?.defaultSellingPrice || 0,
      category: editingMenu?.category || "MAIN",
      recipes: editingMenu?.recipes || [] as {
        ingredientId: string;
        quantity: number;
        lessSugarQuantity?: number | null;
        optional: boolean;
        canExcludeForPersonalUse: boolean;
      }[],
    },
    validate: async (values) => {
      try {
        await menuSchema.validate({
          name: values.name,
          category: values.category,
          basePrice: values.defaultSellingPrice,
          recipe: values.recipes.map(r => ({
            ingredientId: r.ingredientId,
            quantity: r.quantity,
          })),
        }, { abortEarly: false });
      } catch (err: any) {
        return getValidationErrorMap(err);
      }
    },
    onSubmit: async (values) => {
      if (!editingMenu) return;
      try {
        await menusApi.update(editingMenu.id, {
          name: values.name,
          defaultSellingPrice: values.defaultSellingPrice,
          category: values.category,
          recipes: values.recipes.filter(
            (r) => r.ingredientId && r.quantity > 0,
          ),
        });
        setEditingMenu(null);
        editFormik.resetForm();
        toast.success("Menu dan resep berhasil diperbarui");
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  const handleDeleteMenu = async (id: string) => {
    try {
      await menusApi.delete(id);
      toast.success("Menu berhasil dihapus");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Menu & Resep Produk
          </h1>
          <p className="text-ink-secondary text-xs mt-1">
            Konfigurasi menu minuman dan resep bahan baku. HPP otomatis
            terhitung berdasarkan harga unit belanja terbaru.
          </p>
        </div>
        <Button onClick={() => setShowAddMenu(true)}><span className="hidden md:inline"> Buat Menu Baru</span></Button>
      </div>

      {/* Menu List Table */}
      {menus.length > 0 ? (
        <>
          {/* Mobile View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {menus.map((menu) => {
              const sellingPrice = Number(menu.price || menu.defaultSellingPrice);
              const profit = sellingPrice - Number(menu.hpp);
              const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
              const recipeCount = menu.recipes?.length || 0;
              return (
                <div key={menu.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-xs text-ink">{menu.name}</p>
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        {menu.category === "ADDITIONAL" ? "Additional / Extra" : "Menu Utama"}
                      </p>
                    </div>
                    <span className="font-bold text-xs text-ink font-mono">{formatRupiah(sellingPrice)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-surface-soft p-2 rounded-lg border border-border">
                    <div>
                      <p className="text-[9px] text-ink-muted uppercase">Resep</p>
                      <p className="font-bold text-ink">{recipeCount} item</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-ink-muted uppercase">HPP</p>
                      <p className="font-semibold text-error">{formatRupiah(menu.hpp || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-ink-muted uppercase">Margin</p>
                      <p className={`font-bold ${profitMargin >= 60 ? "text-success" : profitMargin >= 40 ? "text-warning" : "text-error"}`}>
                        {profitMargin.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-1 text-[11px] font-semibold">
                    <button 
                      onClick={() => setViewingRecipe(menu)}
                      className="text-link hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen size={11} /> Resep
                    </button>
                    <button 
                      onClick={() => {
                        setEditingMenu({
                          id: menu.id,
                          name: menu.name,
                          defaultSellingPrice: Number(menu.price || menu.defaultSellingPrice),
                          category: menu.category || "MAIN",
                          recipes: (menu.recipes || []).map(r => ({
                            ingredientId: r.ingredientId,
                            quantity: Number(r.quantity),
                            lessSugarQuantity: r.lessSugarQuantity,
                            optional: !!r.optional,
                            canExcludeForPersonalUse: !!r.canExcludeForPersonalUse,
                          })),
                        });
                      }}
                      className="text-link hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setDeletingMenu({ id: menu.id, name: menu.name })}
                      className="text-ink-faint hover:text-error cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto bg-surface border border-border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Menu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead align="right">Estimasi HPP</TableHead>
                  <TableHead align="right">Harga Jual</TableHead>
                  <TableHead align="right">Profit Margin</TableHead>
                  <TableHead align="center">Resep</TableHead>
                  <TableHead align="right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => {
                  const sellingPrice = Number(menu.price || menu.defaultSellingPrice);
                  const profit = sellingPrice - Number(menu.hpp);
                  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
                  const recipeCount = menu.recipes?.length || 0;
                  return (
                    <TableRow key={menu.id}>
                      <TableCell className="font-semibold text-ink whitespace-nowrap">{menu.name}</TableCell>
                      <TableCell className="text-ink-muted whitespace-nowrap">
                        {menu.category === "ADDITIONAL" ? (
                          <span className="bg-surface-soft px-2 py-0.5 rounded border border-border text-[10px] font-mono">
                            Additional
                          </span>
                        ) : (
                          <span className="bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-mono">
                            Menu Utama
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="right" className="font-mono text-error whitespace-nowrap">{formatRupiah(menu.hpp || 0)}</TableCell>
                      <TableCell align="right" className="font-bold font-mono text-ink whitespace-nowrap">{formatRupiah(sellingPrice)}</TableCell>
                      <TableCell align="right" className="font-mono whitespace-nowrap">
                        <span className={`font-bold ${profitMargin >= 60 ? "text-success" : profitMargin >= 40 ? "text-warning" : "text-error"}`}>
                          {formatRupiah(profit)} ({profitMargin.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell align="center" className="whitespace-nowrap">
                        <button 
                          onClick={() => setViewingRecipe(menu)}
                          className="text-[11px] text-link hover:underline font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <BookOpen size={11} /> {recipeCount} Bahan
                        </button>
                      </TableCell>
                      <TableCell align="right" className="space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => {
                            setEditingMenu({
                              id: menu.id,
                              name: menu.name,
                              defaultSellingPrice: Number(menu.price || menu.defaultSellingPrice),
                              category: menu.category || "MAIN",
                              recipes: (menu.recipes || []).map(r => ({
                                ingredientId: r.ingredientId,
                                quantity: Number(r.quantity),
                                lessSugarQuantity: r.lessSugarQuantity,
                                optional: !!r.optional,
                                canExcludeForPersonalUse: !!r.canExcludeForPersonalUse,
                              })),
                            });
                          }}
                          className="text-[11px] text-link hover:underline font-semibold cursor-pointer"
                        >
                          Edit Resep
                        </button>
                        <button 
                          onClick={() => setDeletingMenu({ id: menu.id, name: menu.name })}
                          className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                          title="Hapus Menu"
                        >
                          <Trash2 size={13} className="inline mb-0.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl text-center py-16 px-6 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-muted">
            <BookOpen size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Belum Ada Menu</h3>
            <p className="text-xs text-ink-secondary">Mulai tambahkan daftar menu minuman beserta takaran resep bahan baku.</p>
          </div>
          <Button 
            onClick={() => setShowAddMenu(true)}
            className="mx-auto"
          >
            Buat Menu Pertama
          </Button>
        </div>
      )}

      {/* Modal: Create Menu */}
      <Modal
        isOpen={showAddMenu}
        onClose={() => {
          setShowAddMenu(false);
          addFormik.resetForm();
        }}
        title="Buat Menu Baru & Resep"
        description="Daftarkan menu baru dan tentukan takaran resep untuk otomatisasi pemotongan stok inventory."
      >
        <form onSubmit={addFormik.handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Nama Menu Minuman"
              type="text"
              name="name"
              placeholder="e.g. Avocado Coffee Shake"
              value={addFormik.values.name}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              error={addFormik.touched.name ? addFormik.errors.name : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RupiahInput
                label="Harga Jual Default (Rp)"
                placeholder="e.g. Rp 28.000"
                value={addFormik.values.defaultSellingPrice}
                onChange={(val) =>
                  addFormik.setFieldValue("defaultSellingPrice", val || 0)
                }
                error={addFormik.touched.defaultSellingPrice ? addFormik.errors.defaultSellingPrice : undefined}
              />
              <Select
                label="Kategori Menu"
                name="category"
                value={addFormik.values.category}
                onChange={addFormik.handleChange}
                onBlur={addFormik.handleBlur}
              >
                <option value="MAIN">Menu Utama</option>
                <option value="ADDITIONAL">Additional / Extra</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Bahan Baku Resep
              </label>
              <button
                type="button"
                onClick={() =>
                  addFormik.setFieldValue("recipes", [
                    ...addFormik.values.recipes,
                    {
                      ingredientId: "",
                      quantity: 0,
                      optional: false,
                      canExcludeForPersonalUse: false,
                    },
                  ])
                }
                className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
              >
                Tambah Bahan Resep
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {addFormik.values.recipes.map((recipe, index) => (
                <div
                  key={index}
                  className="bg-surface-soft p-3 rounded-lg border border-border space-y-3 relative"
                >
                  {/* Row 1: Select Ingredient and Qty */}
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-3">
                      <Select
                        label="Pilih Bahan Baku"
                        value={recipe.ingredientId}
                        onChange={(e) => {
                          const copy = [...addFormik.values.recipes];
                          copy[index].ingredientId = e.target.value;
                          addFormik.setFieldValue("recipes", copy);
                        }}
                        required
                      >
                        <option value="">Pilih Bahan Baku</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Input
                        label="Qty"
                        type="number"
                        placeholder="Qty"
                        value={recipe.quantity || ""}
                        onChange={(e) => {
                          const copy = [...addFormik.values.recipes];
                          copy[index].quantity = Number(e.target.value);
                          addFormik.setFieldValue("recipes", copy);
                        }}
                        className="text-center text-sm md:text-base font-bold py-2"
                        min={0.01}
                        step="any"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: HPP Display & Checkbox Exclude */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      {recipe.ingredientId && (
                        <span className="text-[10px] text-ink-muted font-mono bg-surface px-2 py-0.5 rounded border border-border">
                          @{" "}
                          {formatRupiah(
                            ingredients.find(
                              (ing) => ing.id === recipe.ingredientId,
                            )?.latestUnitCost || 0,
                          )}{" "}
                          /{" "}
                          {
                            ingredients.find(
                              (ing) => ing.id === recipe.ingredientId,
                            )?.unit
                          }
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-[10px] text-ink-secondary flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={recipe.canExcludeForPersonalUse}
                          onChange={(e) => {
                            const copy = [...addFormik.values.recipes];
                            copy[index].canExcludeForPersonalUse =
                              e.target.checked;
                            addFormik.setFieldValue("recipes", copy);
                          }}
                          className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                        />
                        Exclude (Pribadi)
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          addFormik.setFieldValue(
                            "recipes",
                            addFormik.values.recipes.filter((_, i) => i !== index),
                          );
                        }}
                        className="text-ink-faint hover:text-error p-1.5 cursor-pointer transition rounded hover:bg-surface border border-transparent hover:border-border"
                        title="Hapus Bahan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const selectedIng = ingredients.find(ing => ing.id === recipe.ingredientId);
                    const isSugar = selectedIng?.name?.toLowerCase().includes("gula");
                    if (!isSugar) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-border">
                        <Input
                          label="Takaran untuk Less Sugar"
                          type="number"
                          placeholder="e.g. 10"
                          value={recipe.lessSugarQuantity === null || recipe.lessSugarQuantity === undefined ? "" : recipe.lessSugarQuantity}
                          onChange={(e) => {
                            const copy = [...addFormik.values.recipes];
                            copy[index].lessSugarQuantity = e.target.value === "" ? null : Number(e.target.value);
                            addFormik.setFieldValue("recipes", copy);
                          }}
                          className="text-xs font-semibold"
                          min={0}
                          step="any"
                        />
                        <div className="flex flex-col justify-end text-[9px] text-ink-muted pb-1 leading-normal">
                          <span>Kustomisasi takaran gula saat opsi "Less Sugar" dipilih. Jika kosong, akan otomatis mengikuti sistem.</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold pt-4 border-t border-border">
              <span className="text-ink-muted">
                Total HPP per Cup (Kalkulasi Otomatis):
              </span>
              <span className="text-success font-bold text-sm font-mono">
                {formatRupiah(
                  addFormik.values.recipes.reduce((sum, r) => {
                    const match = ingredients.find(
                      (ing) => ing.id === r.ingredientId,
                    );
                    return (
                      sum +
                      (match
                        ? Number(match.latestUnitCost) * Number(r.quantity)
                        : 0)
                    );
                  }, 0),
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddMenu(false);
                addFormik.resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={addFormik.isSubmitting}>Simpan Menu</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Menu */}
      <Modal
        isOpen={!!editingMenu}
        onClose={() => {
          setEditingMenu(null);
          editFormik.resetForm();
        }}
        title="Edit Menu & Resep"
        description="Ubah data menu minuman dan takaran resep bahan bakunya."
      >
        {editingMenu && (
          <form onSubmit={editFormik.handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Nama Menu Minuman"
                type="text"
                name="name"
                placeholder="e.g. Avocado Coffee Shake"
                value={editFormik.values.name}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.name ? editFormik.errors.name : undefined}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RupiahInput
                  label="Harga Jual Default (Rp)"
                  placeholder="e.g. Rp 28.000"
                  value={editFormik.values.defaultSellingPrice}
                  onChange={(val) =>
                    editFormik.setFieldValue("defaultSellingPrice", val || 0)
                  }
                  error={editFormik.touched.defaultSellingPrice ? editFormik.errors.defaultSellingPrice : undefined}
                />
                <Select
                  label="Kategori Menu"
                  name="category"
                  value={editFormik.values.category}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                >
                  <option value="MAIN">Menu Utama</option>
                  <option value="ADDITIONAL">Additional / Extra</option>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Bahan Baku Resep
                </label>
                <button
                  type="button"
                  onClick={() =>
                    editFormik.setFieldValue("recipes", [
                      ...editFormik.values.recipes,
                      {
                        ingredientId: "",
                        quantity: 0,
                        optional: false,
                        canExcludeForPersonalUse: false,
                      },
                    ])
                  }
                  className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
                >
                  Tambah Bahan Resep
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {editFormik.values.recipes.map((recipe, index) => (
                  <div
                    key={index}
                    className="bg-surface-soft p-3 rounded-lg border border-border space-y-3 relative"
                  >
                    {/* Row 1: Select Ingredient and Qty */}
                    <div className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-3">
                        <Select
                          label="Pilih Bahan Baku"
                          value={recipe.ingredientId}
                          onChange={(e) => {
                            const copy = [...editFormik.values.recipes];
                            copy[index].ingredientId = e.target.value;
                            editFormik.setFieldValue("recipes", copy);
                          }}
                          required
                        >
                          <option value="">Pilih Bahan Baku</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Input
                          label="Qty"
                          type="number"
                          placeholder="Qty"
                          value={recipe.quantity || ""}
                          onChange={(e) => {
                            const copy = [...editFormik.values.recipes];
                            copy[index].quantity = Number(e.target.value);
                            editFormik.setFieldValue("recipes", copy);
                          }}
                          className="text-center text-sm md:text-base font-bold py-2"
                          min={0.01}
                          step="any"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: HPP Display & Checkbox Exclude */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        {recipe.ingredientId && (
                          <span className="text-[10px] text-ink-muted font-mono bg-surface px-2 py-0.5 rounded border border-border">
                            @{" "}
                            {formatRupiah(
                              ingredients.find(
                                (ing) => ing.id === recipe.ingredientId,
                              )?.latestUnitCost || 0,
                            )}{" "}
                            /{" "}
                            {
                              ingredients.find(
                                (ing) => ing.id === recipe.ingredientId,
                              )?.unit
                            }
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-[10px] text-ink-secondary flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={recipe.canExcludeForPersonalUse}
                            onChange={(e) => {
                              const copy = [...editFormik.values.recipes];
                              copy[index].canExcludeForPersonalUse =
                                e.target.checked;
                              editFormik.setFieldValue("recipes", copy);
                            }}
                            className="rounded border-border text-primary focus:ring-0 cursor-pointer"
                          />
                          Exclude (Pribadi)
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            editFormik.setFieldValue(
                              "recipes",
                              editFormik.values.recipes.filter((_, i) => i !== index),
                            );
                          }}
                          className="text-ink-faint hover:text-error p-1.5 cursor-pointer transition rounded hover:bg-surface border border-transparent hover:border-border"
                          title="Hapus Bahan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const selectedIng = ingredients.find(ing => ing.id === recipe.ingredientId);
                      const isSugar = selectedIng?.name?.toLowerCase().includes("gula");
                      if (!isSugar) return null;
                      return (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-border">
                          <Input
                            label="Takaran untuk Less Sugar"
                            type="number"
                            placeholder="e.g. 10"
                            value={recipe.lessSugarQuantity === null || recipe.lessSugarQuantity === undefined ? "" : recipe.lessSugarQuantity}
                            onChange={(e) => {
                              const copy = [...editFormik.values.recipes];
                              copy[index].lessSugarQuantity = e.target.value === "" ? null : Number(e.target.value);
                              editFormik.setFieldValue("recipes", copy);
                            }}
                            className="text-xs font-semibold"
                            min={0}
                            step="any"
                          />
                          <div className="flex flex-col justify-end text-[9px] text-ink-muted pb-1 leading-normal">
                            <span>Kustomisasi takaran gula saat opsi "Less Sugar" dipilih. Jika kosong, akan otomatis mengikuti sistem.</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs font-semibold pt-4 border-t border-border">
                <span className="text-ink-muted">
                  Total HPP per Cup (Kalkulasi Otomatis):
                </span>
                <span className="text-success font-bold text-sm font-mono">
                  {formatRupiah(
                    editFormik.values.recipes.reduce((sum, r) => {
                      const match = ingredients.find(
                        (ing) => ing.id === r.ingredientId,
                      );
                      return (
                        sum +
                        (match
                          ? Number(match.latestUnitCost) * Number(r.quantity)
                          : 0)
                      );
                    }, 0),
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingMenu(null);
                  editFormik.resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={editFormik.isSubmitting}>Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: View Recipe Detail */}
      <Modal
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        title={`Resep: ${viewingRecipe?.name}`}
        description="Komposisi bahan baku dan takaran saji untuk menu ini."
      >
        {viewingRecipe && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {viewingRecipe.recipes && viewingRecipe.recipes.length > 0 ? (
                viewingRecipe.recipes.map((r: any, idx: number) => {
                  const ingredient = ingredients.find(
                    (ing) => ing.id === r.ingredientId,
                  );
                  const cost = ingredient
                    ? Number(ingredient.latestUnitCost) * Number(r.quantity)
                    : 0;
                  const isSugar = ingredient?.name
                    ?.toLowerCase()
                    .includes("gula");
                  const sugarInfo =
                    isSugar && ingredient
                      ? getSugarInfo(
                          viewingRecipe.name,
                          Number(r.quantity),
                          ingredient.name,
                          ingredient.unit || "",
                          r.lessSugarQuantity,
                        )
                      : null;

                  return (
                    <div
                      key={idx}
                      className="bg-surface-soft p-3 rounded-lg border border-border space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-ink text-xs">
                            {ingredient?.name || "Bahan Tidak Dikenal"}
                          </div>
                          <div className="text-[10px] text-ink-muted">
                            {r.quantity} {ingredient?.unit} @{" "}
                            {formatRupiah(ingredient?.latestUnitCost || 0)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-ink text-xs font-semibold">
                            {formatRupiah(cost)}
                          </div>
                          {r.canExcludeForPersonalUse && (
                            <span className="text-[9px] font-medium text-warning bg-warning/10 px-1.5 py-0.25 rounded ml-2">
                              Bisa Exclude (Pribadi)
                            </span>
                          )}
                        </div>
                      </div>

                      {sugarInfo && (
                        <div className="text-[10px] bg-surface p-2 rounded border border-border grid grid-cols-3 text-center gap-1 mt-1.5">
                          <div>
                            <span className="text-ink-muted block text-[8px] uppercase font-bold">
                              Normal Sugar
                            </span>
                            <span className="font-mono font-semibold text-ink">
                              {sugarInfo.normal}
                            </span>
                          </div>
                          <div className="border-x border-border">
                            <span className="text-ink-muted block text-[8px] uppercase font-bold">
                              Less Sugar
                            </span>
                            <span className="font-mono font-semibold text-primary">
                              {sugarInfo.less}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-muted block text-[8px] uppercase font-bold">
                              No Sugar
                            </span>
                            <span className="font-mono font-semibold text-warning">
                              {sugarInfo.none}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-ink-muted">
                  Belum ada bahan baku yang dikonfigurasi untuk resep ini.
                </div>
              )}
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3 font-semibold text-xs font-mono">
              <span className="text-ink-muted">Estimasi HPP Total:</span>
              <span className="text-success font-bold text-sm">
                {formatRupiah(viewingRecipe.hpp || 0)}
              </span>
            </div>
            <div className="flex justify-end pt-3">
              <Button onClick={() => setViewingRecipe(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingMenu}
        onClose={() => setDeletingMenu(null)}
        onConfirm={() => {
          if (deletingMenu) {
            handleDeleteMenu(deletingMenu.id);
          }
        }}
        title="Hapus Menu & Resep"
        description={`Apakah Anda yakin ingin menghapus menu "${deletingMenu?.name}" beserta seluruh resepnya dari database?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
