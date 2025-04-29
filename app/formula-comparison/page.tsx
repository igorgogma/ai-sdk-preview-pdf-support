import React from 'react';
import MathFormula from '@/components/math-formula';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Simple wrapper components for MathFormula
function BlockFormula({ children }: { children: React.ReactNode }) {
  return <MathFormula formula={String(children)} display={true} />;
}

function InlineFormula({ children }: { children: React.ReactNode }) {
  return <MathFormula formula={String(children)} display={false} />;
}

export default function FormulaComparisonPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Formula Rendering Comparison</h1>

      <h2 className="text-2xl font-bold mb-4">MathJax Formulas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Basic Formulas with MathJax</CardTitle>
            <CardDescription>Using the MathFormula component</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2">Einstein&apos;s famous equation:</p>
              <BlockFormula>E = mc^2</BlockFormula>
            </div>

            <div>
              <p className="mb-2">Newton&apos;s second law:</p>
              <BlockFormula>F = ma</BlockFormula>
            </div>

            <div>
              <p className="mb-2">Inline formula example: <InlineFormula>E = mc^2</InlineFormula> is Einstein&apos;s equation.</p>
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

      <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Implementation Notes</h2>
        <div className="space-y-4">
          <p>
            This page demonstrates how to render mathematical formulas using MathJax:
          </p>

          <div>
            <h3 className="text-xl font-semibold">MathFormula Component</h3>
            <p>
              Uses the existing MathFormula component with MathJax for rendering. This approach leverages the
              MathJax library that&apos;s already included in the project and provides excellent rendering quality.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Key Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Supports a wide range of LaTeX commands</li>
              <li>Handles complex mathematical expressions</li>
              <li>Includes preprocessing to fix common LaTeX formatting issues</li>
              <li>Works with React 19</li>
              <li>Properly handles double exponents and other problematic cases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
