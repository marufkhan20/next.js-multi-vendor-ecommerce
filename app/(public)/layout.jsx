"use client";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function PublicLayout({ children }) {
  const dispatch = useDispatch();
  const { user } = useUser();
  const { getToken } = useAuth();

  const { cartItems } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchProducts({}));
  }, []);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCart({ getToken }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      dispatch(uploadCart({ getToken }));
    }
  }, [cartItems]);
  return (
    <>
      <Banner />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
