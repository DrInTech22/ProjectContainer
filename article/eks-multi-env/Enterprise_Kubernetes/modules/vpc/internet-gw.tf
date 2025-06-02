resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.eks-vpc.id

   tags = {
     Name = var.igw-name
#     "kubernetes.io/cluster/${local.cluster-name}" = "owned"
   }
}