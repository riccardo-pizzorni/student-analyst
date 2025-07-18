��#   S i s t e m a   d i   C a c h i n g   -   s t u d e n t - a n a l y s t 
 
 
 
 # #   A r c h i t e t t u r a 
 
 
 
 I l   s i s t e m a   d i   c a c h i n g   �   s t r u t t u r a t o   s u   t r e   l i v e l l i : 
 
 
 
 -   * * L 1 :   M e m o r y C a c h e L 1 * *     C a c h e   i n   m e m o r i a   p e r   a c c e s s o   u l t r a - r a p i d o . 
 
 -   * * L 2 :   L o c a l S t o r a g e C a c h e L 2 * *     C a c h e   p e r s i s t e n t e   s u   l o c a l S t o r a g e . 
 
 -   * * L 3 :   I n d e x e d D B C a c h e L 3 * *     C a c h e   p e r s i s t e n t e   e   s c a l a b i l e   s u   I n d e x e d D B . 
 
 
 
 O g n i   l i v e l l o   i m p l e m e n t a   i n t e r f a c c e   d e d i c a t e   p e r   g a r a n t i r e   t e s t a b i l i t �   e   i s o l a m e n t o . 
 
 
 
 # #   S e r v i z i   d i   S u p p o r t o 
 
 
 
 -   * * C a c h e A n a l y t i c s E n g i n e * * :   t r a c c i a   a c c e s s i ,   s c r i t t u r e ,   e v i z i o n i   e   t e m p i   d i   r i s p o s t a . 
 
 -   * * S t o r a g e M o n i t o r i n g S e r v i c e * * :   m o n i t o r a   s a l u t e   e   q u o t a   d i   l o c a l S t o r a g e / s e s s i o n S t o r a g e / I n d e x e d D B . 
 
 -   * * A u t o m a t i c C l e a n u p S e r v i c e * * :   g e s t i s c e   l a   p u l i z i a   a u t o m a t i c a   e   p r o g r a m m a t a   d e i   d a t i . 
 
 
 
 # #   M o c k   e   T e s t i n g 
 
 
 
 -   T u t t i   i   m o c k   s o n o   c e n t r a l i z z a t i   i n   ` t e s t s / u t i l s / m o c k s . t s ` . 
 
 -   M o c k   r o b u s t i   p e r   I n d e x e d D B ,   l o c a l S t o r a g e ,   s e s s i o n S t o r a g e ,   w i n d o w ,   T e x t E n c o d e r / T e x t D e c o d e r . 
 
 -   U s o   d i   ` O b j e c t . d e f i n e P r o p e r t y `   p e r   p r o p r i e t �   r e a d - o n l y . 
 
 -   T e s t   u n i t a r i   e   d i   i n t e g r a z i o n e   c o p r o n o   C R U D ,   T T L ,   e v i z i o n e ,   e r r o r i ,   e d g e   c a s e ,   c o n c o r r e n z a . 
 
 -   T e s t   i s o l a t i   t r a m i t e   ` b e f o r e E a c h ` / ` a f t e r E a c h ` . 
 
 -   N e s s u n   s i d e   e f f e c t   t r a   t e s t . 
 
 
 
 # #   B e s t   P r a c t i c e 
 
 
 
 -   * * D e p e n d e n c y   I n j e c t i o n * * :   t u t t i   i   s e r v i z i   a c c e t t a n o   d i p e n d e n z e   v i a   c o s t r u t t o r e   p e r   f a c i l i t a r e   i l   m o c k i n g . 
 
 -   * * C o p e r t u r a * * :   o b i e t t i v o   > 8 0 %   s u   s t a t e m e n t s ,   b r a n c h e s ,   f u n c t i o n s ,   l i n e s . 
 
 -   * * P e r f o r m a n c e * * :   e v i t a r e   t e s t   l e n t i / r i d o n d a n t i ,   u s o   d i   f a k e   t i m e r s   p e r   T T L   e   c l e a n u p . 
 
 -   * * D o c u m e n t a z i o n e * * :   o g n i   t e s t   e   m o c k   �   c o m m e n t a t o   c o n   s p i e g a z i o n e   e   l i m i t i . 
 
 
 
 # #   E s e m p i o   d i   U s o   ( M e m o r y C a c h e L 1 ) 
 
 
 
 ` ` ` t s 
 
 i m p o r t   {   M e m o r y C a c h e L 1   }   f r o m   ' . / M e m o r y C a c h e L 1 ' ; 
 
 c o n s t   c a c h e   =   n e w   M e m o r y C a c h e L 1 ( ) ; 
 
 a w a i t   c a c h e . s e t ( ' k e y ' ,   ' v a l u e ' ,   1 0 0 0 ) ;   / /   T T L   1 s 
 
 c o n s t   v a l u e   =   a w a i t   c a c h e . g e t ( ' k e y ' ) ; 
 
 ` ` ` 
 
 
 
 # #   L i m i t a z i o n i 
 
 
 
 -   I   m o c k   n o n   c o p r o n o   t u t t e   l e   A P I   b r o w s e r   a v a n z a t e   ( e s .   W e b   W o r k e r s ) . 
 
 -   I   t e s t   n o n   c o p r o n o   a n c o r a   c a s i   d i   r a c e   c o n d i t i o n   e s t r e m i . 
 
 
 
 # #   C o m e   e s e g u i r e   i   t e s t   e   g e n e r a r e   i l   r e p o r t   d i   c o p e r t u r a 
 
 
 
 ` ` ` s h 
 
 n p m   r u n   t e s t : u n i t   - -   - - c o v e r a g e   - - v e r b o s e 
 
 ` ` ` 
 
 I l   r e p o r t   H T M L   s a r �   g e n e r a t o   i n   ` c o v e r a g e / l c o v - r e p o r t / i n d e x . h t m l ` . 
 
 
 
 # #   B a d g e   d i   c o p e r t u r a 
 
 
 
 A g g i u n g i   i l   b a d g e   n e l   R E A D M E : 
 
 
 
 ` ` ` 
 
 ! [ c o v e r a g e ] ( h t t p s : / / i m g . s h i e l d s . i o / b a d g e / c o v e r a g e - 8 0 % 2 5 - b r i g h t g r e e n ) 
 
 ` ` ` 
 
 
 
 # #   S c e l t e   d i   d e s i g n 
 
 
 
 -   S e p a r a z i o n e   n e t t a   t r a   l o g i c a   d i   b u s i n e s s   e   i n f r a s t r u t t u r a   d i   c a c h i n g . 
 
 -   M o c k   c e n t r a l i z z a t i   e   r i u t i l i z z a b i l i . 
 
 -   R e f a c t o r i n g   c o n t i n u o   p e r   m a n t e n e r e   t e s t a b i l i t �   e   r e t r o c o m p a t i b i l i t � . 
 
 
