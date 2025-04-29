"use client";

import React from 'react';
import Formula, { InlineFormula, BlockFormula } from '@/components/enhanced-formula';
import KaTeXFormula, { InlineKaTeXFormula, BlockKaTeXFormula } from '@/components/katex-formula';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FormulaComparisonPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Formula Rendering Comparison</h1>
      
      <Tabs defaultValue="mathjax" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mathjax">MathJax (Enhanced Formula)</TabsTrigger>
          <TabsTrigger value="katex">KaTeX (Direct Implementation)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mathjax">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Formulas with MathJax</CardTitle>
                <CardDescription>Using the enhanced MathFormula component</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Einstein's famous equation:</p>
                  <BlockFormula>E = mc^2</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Newton's second law:</p>
                  <BlockFormula>F = ma</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Inline formula example: <InlineFormula>E = mc^2</InlineFormula> is Einstein's equation.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Physics Formulas with MathJax</CardTitle>
                <CardDescription>Common physics equations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Projectile motion range:</p>
                  <BlockFormula>R = \frac{v_0^2\sin(2\theta)}{g}</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Kinetic energy:</p>
                  <BlockFormula>E_k = \frac{1}{2}mv^2</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Gravitational potential energy:</p>
                  <BlockFormula>E_p = mgh</BlockFormula>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Complex Formulas with MathJax</CardTitle>
                <CardDescription>More complex mathematical expressions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Integral example:</p>
                  <BlockFormula>\int_0^\infty x^2 dx</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Matrix example:</p>
                  <BlockFormula>\begin{pmatrix} a & b \\ c & d \end{pmatrix}</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Limit example:</p>
                  <BlockFormula>\lim_{x \to \infty} \frac{1}{x}</BlockFormula>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Problematic Formulas with MathJax</CardTitle>
                <CardDescription>Formulas that were previously difficult to render</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Double exponent example:</p>
                  <BlockFormula>45^{\circ} \cdot v_0 = 20^0</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Fraction with complex subscript:</p>
                  <BlockFormula>\frac{1}{2}g(v_{\text{total}})^{2}</BlockFormula>
                </div>
                
                <div>
                  <p className="mb-2">Angle with velocity:</p>
                  <BlockFormula>v_0 = 20 \text{ m/s at } 45^{\circ}</BlockFormula>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="katex">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Formulas with KaTeX</CardTitle>
                <CardDescription>Using the direct KaTeX implementation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Einstein's famous equation:</p>
                  <BlockKaTeXFormula>E = mc^2</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Newton's second law:</p>
                  <BlockKaTeXFormula>F = ma</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Inline formula example: <InlineKaTeXFormula>E = mc^2</InlineKaTeXFormula> is Einstein's equation.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Physics Formulas with KaTeX</CardTitle>
                <CardDescription>Common physics equations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Projectile motion range:</p>
                  <BlockKaTeXFormula>R = \frac{v_0^2\sin(2\theta)}{g}</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Kinetic energy:</p>
                  <BlockKaTeXFormula>E_k = \frac{1}{2}mv^2</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Gravitational potential energy:</p>
                  <BlockKaTeXFormula>E_p = mgh</BlockKaTeXFormula>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Complex Formulas with KaTeX</CardTitle>
                <CardDescription>More complex mathematical expressions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Integral example:</p>
                  <BlockKaTeXFormula>\int_0^\infty x^2 dx</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Matrix example:</p>
                  <BlockKaTeXFormula>\begin{pmatrix} a & b \\ c & d \end{pmatrix}</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Limit example:</p>
                  <BlockKaTeXFormula>\lim_{x \to \infty} \frac{1}{x}</BlockKaTeXFormula>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Problematic Formulas with KaTeX</CardTitle>
                <CardDescription>Formulas that were previously difficult to render</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2">Double exponent example:</p>
                  <BlockKaTeXFormula>45^{\circ} \cdot v_0 = 20^0</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Fraction with complex subscript:</p>
                  <BlockKaTeXFormula>\frac{1}{2}g(v_{\text{total}})^{2}</BlockKaTeXFormula>
                </div>
                
                <div>
                  <p className="mb-2">Angle with velocity:</p>
                  <BlockKaTeXFormula>v_0 = 20 \text{ m/s at } 45^{\circ}</BlockKaTeXFormula>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Implementation Notes</h2>
        <div className="space-y-4">
          <p>
            This page demonstrates two different approaches to rendering mathematical formulas:
          </p>
          
          <div>
            <h3 className="text-xl font-semibold">1. Enhanced Formula (MathJax)</h3>
            <p>
              Uses the existing MathFormula component with MathJax for rendering. This approach leverages the 
              MathJax library that's already included in the project and provides excellent rendering quality.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">2. KaTeX Formula (Direct Implementation)</h3>
            <p>
              A custom implementation that uses KaTeX directly without relying on react-katex. This approach 
              is compatible with React 19 and provides faster rendering, though with slightly different output.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">Key Differences</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>MathJax generally provides better quality rendering but is slower</li>
              <li>KaTeX is faster but may not support all LaTeX commands</li>
              <li>Both implementations include preprocessing to fix common LaTeX formatting issues</li>
              <li>The KaTeX implementation doesn't require react-katex and works with React 19</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
